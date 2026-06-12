import type { BreathingPattern } from '../types/breathing';

export interface SessionSnapshot {
  stepIndex: number;
  /** 0..1 within the current step */
  phaseProgress: number;
  /** Completed full cycles */
  cycleCount: number;
  /** Ball position 0..1, eased */
  ballY: number;
  /** floor(elapsedMs / pattern.defaultBeatMs) — metronome boundary detection */
  beatIndex: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getCycleDurationMs(pattern: BreathingPattern): number {
  const totalBeats = pattern.steps.reduce((s, step) => s + step.beats, 0);
  return totalBeats * pattern.defaultBeatMs;
}

function getStartY(pattern: BreathingPattern, stepIndex: number): number {
  if (stepIndex === 0) {
    return pattern.steps[pattern.steps.length - 1].targetY;
  }
  return pattern.steps[stepIndex - 1].targetY;
}

/**
 * Pure derivation of session state from wall-clock elapsed time.
 * Handles arbitrary forward jumps in O(1) via modular arithmetic over the
 * cycle duration. Total: never throws; elapsed is clamped to >= 0.
 */
export function computeSnapshot(
  pattern: BreathingPattern,
  elapsedMs: number,
): SessionSnapshot {
  const elapsed = Math.max(0, elapsedMs);
  const cycleDurationMs = getCycleDurationMs(pattern);

  if (cycleDurationMs <= 0 || pattern.steps.length === 0) {
    return { stepIndex: 0, phaseProgress: 0, cycleCount: 0, ballY: 0, beatIndex: 0 };
  }

  const cycleCount = Math.floor(elapsed / cycleDurationMs);
  let inCycleMs = elapsed % cycleDurationMs;

  let stepIndex = 0;
  let phaseProgress = 0;
  for (let i = 0; i < pattern.steps.length; i++) {
    const stepDurationMs = pattern.steps[i].beats * pattern.defaultBeatMs;
    if (inCycleMs < stepDurationMs || i === pattern.steps.length - 1) {
      stepIndex = i;
      phaseProgress = stepDurationMs > 0 ? Math.min(inCycleMs / stepDurationMs, 1) : 1;
      break;
    }
    inCycleMs -= stepDurationMs;
  }

  const step = pattern.steps[stepIndex];
  const startY = getStartY(pattern, stepIndex);
  const eased = step.phase === 'hold' || step.phase === 'rest'
    ? 1
    : 0.5 - 0.5 * Math.cos(Math.PI * phaseProgress); // smooth ease-in-out
  const ballY = lerp(startY, step.targetY, eased);

  const beatIndex = pattern.defaultBeatMs > 0
    ? Math.floor(elapsed / pattern.defaultBeatMs)
    : 0;

  return { stepIndex, phaseProgress, cycleCount, ballY, beatIndex };
}
