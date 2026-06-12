import { describe, expect, it } from 'vitest';
import { PATTERNS } from '../types/breathing';
import { computeSnapshot, getCycleDurationMs } from './sessionMath';

const box = PATTERNS.find(p => p.id === 'box')!;        // 4 steps x 4000ms
const focus = PATTERNS.find(p => p.id === 'foci-focus')!; // 0.5+0.5+1.0 beats x 2500ms
const coherent = PATTERNS.find(p => p.id === 'coherent')!; // 2 steps x 5500ms

describe('getCycleDurationMs', () => {
  it('sums beats times defaultBeatMs', () => {
    expect(getCycleDurationMs(box)).toBe(16_000);
    expect(getCycleDurationMs(focus)).toBe(5_000);
    expect(getCycleDurationMs(coherent)).toBe(11_000);
  });
});

describe('computeSnapshot', () => {
  it('returns initial state at elapsed 0', () => {
    const snap = computeSnapshot(box, 0);
    expect(snap.stepIndex).toBe(0);
    expect(snap.phaseProgress).toBe(0);
    expect(snap.cycleCount).toBe(0);
    expect(snap.beatIndex).toBe(0);
  });

  it('clamps negative elapsed to 0', () => {
    const snap = computeSnapshot(box, -500);
    expect(snap.stepIndex).toBe(0);
    expect(snap.phaseProgress).toBe(0);
    expect(snap.cycleCount).toBe(0);
  });

  it('computes mid-phase progress', () => {
    // box inhale step lasts 4000ms; at 2000ms we are halfway
    const snap = computeSnapshot(box, 2000);
    expect(snap.stepIndex).toBe(0);
    expect(snap.phaseProgress).toBeCloseTo(0.5);
    expect(snap.cycleCount).toBe(0);
  });

  it('advances step at exact phase boundary', () => {
    const snap = computeSnapshot(box, 4000);
    expect(snap.stepIndex).toBe(1);
    expect(snap.phaseProgress).toBe(0);
  });

  it('wraps to a new cycle at exact cycle boundary', () => {
    const snap = computeSnapshot(box, 16_000);
    expect(snap.cycleCount).toBe(1);
    expect(snap.stepIndex).toBe(0);
    expect(snap.phaseProgress).toBe(0);
  });

  it('handles fractional-beat steps (foci-focus)', () => {
    // steps: 1250ms, 1250ms, 2500ms
    expect(computeSnapshot(focus, 600).stepIndex).toBe(0);
    expect(computeSnapshot(focus, 1300).stepIndex).toBe(1);
    expect(computeSnapshot(focus, 2600).stepIndex).toBe(2);
    expect(computeSnapshot(focus, 2600).phaseProgress).toBeCloseTo(100 / 2500);
  });

  it('resolves a large forward jump (10 minutes) in one call', () => {
    const elapsed = 10 * 60_000; // 600 000 ms
    const snap = computeSnapshot(box, elapsed);
    // 600000 / 16000 = 37.5 cycles
    expect(snap.cycleCount).toBe(37);
    // 0.5 of a cycle = 8000ms = start of step 2 (exhale)
    expect(snap.stepIndex).toBe(2);
    expect(snap.phaseProgress).toBe(0);
    expect(snap.beatIndex).toBe(elapsed / box.defaultBeatMs);
  });

  it('keeps all derived values consistent from one elapsed value', () => {
    const elapsed = 123_456;
    const snap = computeSnapshot(coherent, elapsed);
    const cycleMs = getCycleDurationMs(coherent);
    expect(snap.cycleCount).toBe(Math.floor(elapsed / cycleMs));
    const inCycle = elapsed % cycleMs;
    const expectedStep = inCycle < 5500 ? 0 : 1;
    expect(snap.stepIndex).toBe(expectedStep);
    expect(snap.beatIndex).toBe(Math.floor(elapsed / coherent.defaultBeatMs));
    expect(snap.ballY).toBeGreaterThanOrEqual(0);
    expect(snap.ballY).toBeLessThanOrEqual(1);
  });

  it('eases ballY: holds pin to target, breath phases interpolate', () => {
    // box step 1 is 'hold' at top — ballY stays at targetY 1.0 throughout
    expect(computeSnapshot(box, 5000).ballY).toBe(1);
    // inhale at halfway: eased value strictly between 0 and 1
    const mid = computeSnapshot(box, 2000).ballY;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('is total for elapsed far beyond any session duration', () => {
    const snap = computeSnapshot(focus, 24 * 60 * 60_000);
    expect(Number.isFinite(snap.cycleCount)).toBe(true);
    expect(snap.stepIndex).toBeGreaterThanOrEqual(0);
    expect(snap.stepIndex).toBeLessThan(focus.steps.length);
  });
});
