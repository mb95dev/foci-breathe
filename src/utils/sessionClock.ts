/**
 * Anchored wall-clock session timer. Elapsed time is always derived from
 * `performance.now()` minus the start anchor minus accumulated paused spans,
 * never from accumulated ticks — so it stays correct under browser throttling.
 */
export class SessionClock {
  private startTs: number | null = null;
  private pauseTs: number | null = null;
  private pausedAccumMs = 0;

  start(): void {
    this.startTs = performance.now();
    this.pauseTs = null;
    this.pausedAccumMs = 0;
  }

  pause(): void {
    if (this.startTs === null || this.pauseTs !== null) return;
    this.pauseTs = performance.now();
  }

  resume(): void {
    if (this.startTs === null || this.pauseTs === null) return;
    this.pausedAccumMs += performance.now() - this.pauseTs;
    this.pauseTs = null;
  }

  isPaused(): boolean {
    return this.pauseTs !== null;
  }

  isStarted(): boolean {
    return this.startTs !== null;
  }

  /** Elapsed session ms; 0 when not started, frozen while paused. */
  getElapsedMs(now: number = performance.now()): number {
    if (this.startTs === null) return 0;
    const effectiveNow = this.pauseTs !== null ? this.pauseTs : now;
    return Math.max(0, effectiveNow - this.startTs - this.pausedAccumMs);
  }

  reset(): void {
    this.startTs = null;
    this.pauseTs = null;
    this.pausedAccumMs = 0;
  }
}
