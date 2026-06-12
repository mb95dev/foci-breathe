import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionClock } from './sessionClock';

let nowValue = 0;

beforeEach(() => {
  nowValue = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionClock', () => {
  it('returns 0 before start', () => {
    const clock = new SessionClock();
    expect(clock.getElapsedMs()).toBe(0);
    expect(clock.isStarted()).toBe(false);
  });

  it('elapsed grows with wall clock after start', () => {
    const clock = new SessionClock();
    clock.start();
    nowValue += 5000;
    expect(clock.getElapsedMs()).toBe(5000);
    nowValue += 90_000; // large jump, e.g. backgrounded tab
    expect(clock.getElapsedMs()).toBe(95_000);
  });

  it('accepts an explicit now argument', () => {
    const clock = new SessionClock();
    clock.start();
    expect(clock.getElapsedMs(nowValue + 1234)).toBe(1234);
  });

  it('freezes elapsed while paused', () => {
    const clock = new SessionClock();
    clock.start();
    nowValue += 3000;
    clock.pause();
    nowValue += 60_000;
    expect(clock.getElapsedMs()).toBe(3000);
    expect(clock.isPaused()).toBe(true);
  });

  it('excludes the paused span after resume', () => {
    const clock = new SessionClock();
    clock.start();
    nowValue += 3000;
    clock.pause();
    nowValue += 10_000;
    clock.resume();
    nowValue += 2000;
    expect(clock.getElapsedMs()).toBe(5000);
  });

  it('accumulates multiple pause/resume cycles', () => {
    const clock = new SessionClock();
    clock.start();
    nowValue += 1000;
    clock.pause();
    nowValue += 500;
    clock.resume();
    nowValue += 1000;
    clock.pause();
    nowValue += 2500;
    clock.resume();
    nowValue += 1000;
    expect(clock.getElapsedMs()).toBe(3000);
  });

  it('ignores redundant pause/resume calls', () => {
    const clock = new SessionClock();
    clock.resume(); // not started — no-op
    clock.pause();  // not started — no-op
    expect(clock.getElapsedMs()).toBe(0);
    clock.start();
    clock.pause();
    clock.pause(); // already paused — no-op
    nowValue += 1000;
    clock.resume();
    clock.resume(); // not paused — no-op
    nowValue += 700;
    expect(clock.getElapsedMs()).toBe(700);
  });

  it('reset clears all state', () => {
    const clock = new SessionClock();
    clock.start();
    nowValue += 5000;
    clock.reset();
    expect(clock.getElapsedMs()).toBe(0);
    expect(clock.isStarted()).toBe(false);
    expect(clock.isPaused()).toBe(false);
  });
});
