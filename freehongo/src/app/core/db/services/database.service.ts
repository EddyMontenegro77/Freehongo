import { Service, signal } from '@angular/core';
import { userDbName, GUEST_DB_NAME, FreeHongoDB } from '../db';
import { Dexie } from 'dexie';

@Service()
export class DatabaseService {
  private readonly _db = signal<FreeHongoDB | null>(null);
  private queue: Promise<unknown> = Promise.resolve();

  readonly current = this._db.asReadonly();

  get database(): FreeHongoDB {
    const db = this._db();
    if (!db?.isOpen()) throw new Error('Database is not initialized');
    return db;
  }

  initialize(userId?: string): Promise<FreeHongoDB> {
    const run = this.queue.then(() => this.switchTo(userId));
    this.queue = run.catch(() => undefined);
    return run;
  }

  deleteUserDb(userId: string): Promise<void> {
    const run = this.queue.then(async () => {
      await this.switchTo();
      await Dexie.delete(userDbName(userId));
    });

    this.queue = run.catch(() => undefined);

    return run;
  }

  private async adoptGuestData(user: FreeHongoDB): Promise<void> {
    if (!(await Dexie.exists(GUEST_DB_NAME))) return;
    const guest = new FreeHongoDB(GUEST_DB_NAME);
    try {
      await guest.open();
      await adoptAnonData(guest, user);
    } finally {
      guest.close();
    }
  }

  private async switchTo(userId?: string): Promise<FreeHongoDB> {
    const normalizedId = userId?.trim() || undefined;

    const name = normalizedId ? userDbName(normalizedId) : GUEST_DB_NAME;

    const prev = this._db();

    if (prev?.name === name && prev.isOpen()) {
      return prev;
    }

    const next = new FreeHongoDB(name);

    try {
      await next.open();

      if (normalizedId) {
        await this.adoptGuestData(next);
      }

      this._db.set(next);
      prev?.close();

      return next;
    } catch (error) {
      next.close();
      throw error;
    }
  }
}

async function adoptAnonData(anon: FreeHongoDB, user: FreeHongoDB): Promise<void> {
  const [lists, sessions, answers, stats] = await Promise.all([
    anon.lists.toArray(),
    anon.quizSessions.toArray(),
    anon.quizAnswers.toArray(),
    anon.characterStats.toArray(),
  ]);

  if (!lists.length && !sessions.length && !answers.length && !stats.length) {
    return;
  }

  await user.transaction(
    'rw',
    user.lists,
    user.quizSessions,
    user.quizAnswers,
    user.characterStats,
    async () => {
      const [existingLists, existingSessions, existingAnswers, existingStats] = await Promise.all([
        user.lists.bulkGet(lists.map((l) => l.listId)),
        user.quizSessions.bulkGet(sessions.map((s) => s.quizSessionId)),
        user.quizAnswers.bulkGet(answers.map((a) => [a.quizSessionId, a.unicode])),
        user.characterStats.bulkGet(stats.map((s) => [s.unicode, s.answerType])),
      ]);

      const newLists = lists.filter((_, i) => !existingLists[i]);
      const newSessions = sessions.filter((_, i) => !existingSessions[i]);
      const newAnswers = answers.filter((_, i) => !existingAnswers[i]);
      const newStats = stats.filter((_, i) => !existingStats[i]);

      await user.lists.bulkPut(
        newLists.map((l) => ({
          ...l,
          syncStatus: 'pending' as const,
        })),
      );

      await user.quizSessions.bulkPut(
        newSessions.map((s) => ({
          ...s,
          syncStatus: 'pending' as const,
        })),
      );

      await user.quizAnswers.bulkPut(newAnswers);
      await user.characterStats.bulkPut(newStats);
    },
  );

  await anon.transaction(
    'rw',
    anon.lists,
    anon.quizSessions,
    anon.quizAnswers,
    anon.characterStats,
    async () => {
      await Promise.all([
        anon.lists.clear(),
        anon.quizSessions.clear(),
        anon.quizAnswers.clear(),
        anon.characterStats.clear(),
      ]);
    },
  );
}
