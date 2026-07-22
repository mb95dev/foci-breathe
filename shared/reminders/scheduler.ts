export interface AlarmAdapter {
  create(name: string, delayMs: number): void;
  clear(name: string): void;
}

interface SchedulerState {
  status: 'stopped' | 'active' | 'paused';
  intervalMs: number;
  countdownStartedAt: number | undefined;
  remainingMs: number | undefined;
}

export interface SchedulerRestoreState {
  status: 'active' | 'paused';
  intervalMs: number;
  remainingMs: number;
}

export interface Scheduler {
  start(intervalMs: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  restore(state: SchedulerRestoreState): void;
  getRemainingMs(now: number): number | undefined;
  getStatus(): 'stopped' | 'active' | 'paused';
  getIntervalMs(): number;
  onAlarmFired(): void;
}

const ALARM_NAME = 'foci-reminder';

export function createScheduler(alarmAdapter: AlarmAdapter): Scheduler {
  let state: SchedulerState = {
    status: 'stopped',
    intervalMs: 30 * 60_000,
    countdownStartedAt: undefined,
    remainingMs: undefined,
  };

  function scheduleAlarm(delayMs: number): void {
    alarmAdapter.create(ALARM_NAME, Math.max(0, delayMs));
  }

  return {
    start(intervalMs: number) {
      alarmAdapter.clear(ALARM_NAME);
      state = {
        status: 'active',
        intervalMs,
        countdownStartedAt: Date.now(),
        remainingMs: undefined,
      };
      scheduleAlarm(intervalMs);
    },

    pause() {
      if (state.status !== 'active') return;
      const remaining = this.getRemainingMs(Date.now()) ?? state.intervalMs;
      alarmAdapter.clear(ALARM_NAME);
      state = {
        ...state,
        status: 'paused',
        remainingMs: remaining,
        countdownStartedAt: undefined,
      };
    },

    resume() {
      if (state.status !== 'paused' || state.remainingMs === undefined) return;
      const remaining = state.remainingMs;
      state = {
        ...state,
        status: 'active',
        countdownStartedAt: Date.now() - (state.intervalMs - remaining),
        remainingMs: undefined,
      };
      scheduleAlarm(remaining);
    },

    stop() {
      alarmAdapter.clear(ALARM_NAME);
      state = {
        status: 'stopped',
        intervalMs: state.intervalMs,
        countdownStartedAt: undefined,
        remainingMs: undefined,
      };
    },

    restore(restored) {
      alarmAdapter.clear(ALARM_NAME);
      if (restored.status === 'paused') {
        state = {
          status: 'paused',
          intervalMs: restored.intervalMs,
          remainingMs: restored.remainingMs,
          countdownStartedAt: undefined,
        };
        return;
      }

      state = {
        status: 'active',
        intervalMs: restored.intervalMs,
        countdownStartedAt: Date.now() - (restored.intervalMs - restored.remainingMs),
        remainingMs: undefined,
      };
      scheduleAlarm(restored.remainingMs);
    },

    getRemainingMs(now: number) {
      if (state.status === 'stopped') return undefined;
      if (state.status === 'paused') return state.remainingMs;
      if (state.countdownStartedAt === undefined) return undefined;
      return Math.max(0, state.intervalMs - (now - state.countdownStartedAt));
    },

    getStatus() {
      return state.status;
    },

    getIntervalMs() {
      return state.intervalMs;
    },

    onAlarmFired() {
      if (state.status !== 'active') return;
      state = {
        ...state,
        countdownStartedAt: Date.now(),
      };
      scheduleAlarm(state.intervalMs);
    },
  };
}

export { ALARM_NAME };
