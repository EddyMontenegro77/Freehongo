import { FreeHongoDB } from '../../../core/db/db';
import { dayKey, leftJoin } from '../../../core/db/utils/query.utils';
import {
  FetchQuizSessionFilters,
  QuizSessionWithList,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';

export class QuizHistoryRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async fetchQuizSession(filters: FetchQuizSessionFilters): Promise<QuizSessionWithList[]> {
    const [lists, sessions] = await Promise.all([
      this.db.lists.filter((list) => !list.deletedAt).toArray(),
      filters.descOrder
        ? this.db.quizSessions.orderBy('startedAt').reverse().toArray()
        : this.db.quizSessions.orderBy('startedAt').toArray(),
    ]);

    const listName = filters.listName?.trim().toLowerCase();

    return leftJoin(
      sessions,
      lists,
      (session) => session.listId,
      (list) => list.listId,
    )
      .filter(([session, list]) => {
        if (listName && !(list?.name ?? session.listName ?? '').toLowerCase().includes(listName)) return false;
        if (filters.answerType && session.answerType !== filters.answerType) return false;
        if (filters.characterQuizType && session.characterQuizType !== filters.characterQuizType)
          return false;
        if (filters.finishedAt && dayKey(session.finishedAt) !== filters.finishedAt) return false;
        return true;
      })
      .map(([session, list]) => ({ ...session, listName: list?.name ?? session.listName ?? null }));
  }
}
