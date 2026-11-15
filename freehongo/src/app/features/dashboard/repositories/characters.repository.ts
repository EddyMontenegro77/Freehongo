import { FreeHongoDB } from '../../../core/db/db';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import { AnswerType, CharacterQuizType } from '../../../shared/models/quizes/quizes.interface';
import {
  CharacterAttempt,
  CharacterDetail,
  PracticedCharacter,
  WEAK_THRESHOLD,
} from '../models/dashboard.models';
import { countPairs, skillOf, summarizeWriting, weaknessScore } from '../utils/dashboard.utils';

const CHAR_ANSWER_QUIZ_TYPES: CharacterQuizType[] = ['readingToCharacter', 'meaningToCharacter'];
const isHexUnicode = (v: string): boolean => /^[0-9a-f]{4,6}$/i.test(v);

const isCharacterConfusion = (a: StoredQuizAnswer, s: StoredQuizSession | undefined): boolean =>
  !!a.confusedWith &&
  isHexUnicode(a.confusedWith) &&
  s?.answerType === 'multiple' &&
  !!s.characterQuizType &&
  CHAR_ANSWER_QUIZ_TYPES.includes(s.characterQuizType);

export class CharactersRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async getWeakCharacters(
    minAttempts = 3,
    limit = 10,
    answerType?: AnswerType,
  ): Promise<StoredCharacterStat[]> {
    const rows = await this.db.characterStats
      .filter((s) => s.attempts >= minAttempts && (!answerType || s.answerType === answerType))
      .toArray();

    return rows
      .filter((s) => weaknessScore(s) < WEAK_THRESHOLD)
      .sort(
        (a, b) =>
          weaknessScore(a) - weaknessScore(b) ||
          a.correctStreak - b.correctStreak ||
          b.attempts - a.attempts ||
          b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
      )
      .slice(0, limit);
  }

  async getPracticedCharacters(answerType?: AnswerType): Promise<PracticedCharacter[]> {
    const rows = await this.db.characterStats
      .filter((s) => !answerType || s.answerType === answerType)
      .toArray();

    const byChar = new Map<string, { attempts: number; correct: number; last: Date }>();
    for (const s of rows) {
      const cur = byChar.get(s.unicode) ?? { attempts: 0, correct: 0, last: s.lastSeenAt };
      cur.attempts += s.attempts;
      cur.correct += s.correctCount;
      if (s.lastSeenAt > cur.last) cur.last = s.lastSeenAt;
      byChar.set(s.unicode, cur);
    }

    return [...byChar].map(([unicode, c]) => {
      const accuracy = c.correct / c.attempts;
      return {
        unicode,
        attempts: c.attempts,
        accuracy,
        masteryScore: accuracy * Math.min(c.attempts / 10, 1),
        lastSeenAt: c.last,
      };
    });
  }

  async getCharacterDetail(unicode: string, recentLimit = 10): Promise<CharacterDetail> {
    const [stats, answers, confusedByRows] = await Promise.all([
      this.db.characterStats.where('unicode').equals(unicode).toArray(),
      this.db.quizAnswers.where('unicode').equals(unicode).toArray(),
      this.db.quizAnswers.where('confusedWith').equals(unicode).toArray(),
    ]);

    const sessionIds = [...new Set([...answers, ...confusedByRows].map((a) => a.quizSessionId))];
    const sessions = await this.db.quizSessions.bulkGet(sessionIds);
    const sessionById = new Map(
      sessions.filter((s): s is StoredQuizSession => !!s).map((s) => [s.quizSessionId, s]),
    );

    const attempts: CharacterAttempt[] = [];
    for (const a of answers) {
      const session = sessionById.get(a.quizSessionId);
      if (!session) continue;

      const skill = skillOf(session);
      if (!skill) continue;

      attempts.push({
        answeredAt: a.answeredAt ?? session.finishedAt,
        isCorrect: a.isCorrect,
        responseTimeMs: a.responseTimeMs,
        givenAnswer: a.givenAnswer,
        expectedAnswer: a.expectedAnswer,
        answerType: session.answerType,
        skill,
        listId: session.listId,
      });
    }
    attempts.sort((x, y) => y.answeredAt.getTime() - x.answeredAt.getTime());

    return {
      unicode,
      stats,
      recentAttempts: attempts.slice(0, recentLimit),
      confusedWith: countPairs(
        answers
          .filter((a) => isCharacterConfusion(a, sessionById.get(a.quizSessionId)))
          .map((a) => a.confusedWith),
      ),
      confusedBy: countPairs(
        confusedByRows
          .filter((a) => isCharacterConfusion(a, sessionById.get(a.quizSessionId)))
          .map((a) => a.unicode),
      ),
      writing: summarizeWriting(answers),
    };
  }
}
