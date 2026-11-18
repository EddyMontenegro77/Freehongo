import { computed, effect, inject, Service, untracked } from '@angular/core';
import { SyncService } from '../sync.service';
import { AuthService } from '../../../shared/services/auth/auth.service';

@Service()
export class SyncTriggerService {
  private readonly sync = inject(SyncService);
  private readonly auth = inject(AuthService);

  private readonly userId = computed(() => this.auth.user()?.userId ?? null);
  private debounceId?: ReturnType<typeof setTimeout>;
  private started = false;

  constructor() {
    effect(() => {
      if (this.userId()) untracked(() => this.run());
    });
  }

  start(): void {
    window.addEventListener('online', () => this.run());
    this.run();
  }

  run(): void {
    if (!this.auth.isAuth()) return;
    void this.sync.sync().catch((e) => console.error('Sync failed', e));
  }

  schedule(delayMs = 3000): void {
    clearTimeout(this.debounceId);
    this.debounceId = setTimeout(() => this.run(), delayMs);
  }
}
