import { inject, Service } from '@angular/core';
import { ListSyncService } from './services/list-sync.service';
import { QuizSyncService } from './services/quiz-sync.service';
import { DashboardStatsService } from '../../features/dashboard/services/dashboard-stats.service';
import { FullSyncResult } from './models/sync.models';

@Service()
export class SyncService {
  private readonly listSync = inject(ListSyncService);
  private readonly quizSync = inject(QuizSyncService);
  private readonly dashboardStats = inject(DashboardStatsService);

  private running?: Promise<FullSyncResult>;
  private rerunRequested = false;

  sync(): Promise<FullSyncResult> {
    if (this.running) {
      this.rerunRequested = true;
      return this.running;
    }

    this.running = this.runLoop().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async runLoop(): Promise<FullSyncResult> {
    let result: FullSyncResult;
    do {
      this.rerunRequested = false;
      result = await this.runSync();
    } while (this.rerunRequested && !result.lists.aborted && !result.quizzes.aborted);
    return result;
  }

  private async runSync(): Promise<FullSyncResult> {
    const lists = await this.listSync.syncPending();
    const quizzes = await this.quizSync.syncPending();

    let pulled: FullSyncResult['pulled'] = null;

    if (!lists.aborted && !quizzes.aborted) {
      const listsPull = await this.listSync.pullRemote();
      const quizzesPull = await this.quizSync.pullRemote();
      pulled = { lists: listsPull, quizzes: quizzesPull };

      if (quizzesPull.inserted > 0) {
        try {
          await this.dashboardStats.rebuildCharacterStats();
        } catch (error) {
          console.error('Could not rebuild character stats', error);
        }
      }
    }

    return {
      lists,
      quizzes,
      pulled,
      total: lists.total + quizzes.total,
      synced: lists.synced + quizzes.synced,
      failed: lists.failed + quizzes.failed,
    };
  }
}
