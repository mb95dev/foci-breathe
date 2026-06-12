import { useCallback, useEffect, useRef, useState } from 'react';
import type { BreathingPattern, SessionState } from '../types/breathing';
import { SessionClock } from '../utils/sessionClock';
import { computeSnapshot, getCycleDurationMs } from '../utils/sessionMath';
import { audioEngine } from '../audio/audioEngine';

const INITIAL: SessionState = {
  isRunning: false,
  isPaused: false,
  ballY: 0,
  currentPhase: 'rest',
  phaseLabel: 'Ready',
  phaseProgress: 0,
  cycleCount: 0,
  elapsedMs: 0,
  totalDurationMs: 0,
  currentStepIndex: 0,
  bpm: 0,
};

/** Backstop cadence: bounds completion latency while rAF is throttled. */
const BACKSTOP_INTERVAL_MS = 1000;

export function useBreathingSession(
  pattern: BreathingPattern,
  durationMinutes: number,
  audioEnabled: boolean,
  customTickerBuffer: AudioBuffer | null = null,
) {
  const [state, setState] = useState<SessionState>(INITIAL);

  const clockRef = useRef<SessionClock | null>(null);
  if (clockRef.current === null) clockRef.current = new SessionClock();
  const clock = clockRef.current;

  const rafRef = useRef(0);
  const backstopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBeatIndexRef = useRef(-1);
  const finalizedRef = useRef(false);

  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;
  const customBufferRef = useRef(customTickerBuffer);
  customBufferRef.current = customTickerBuffer;
  const patternRef = useRef(pattern);
  patternRef.current = pattern;

  const cycleDurationMs = getCycleDurationMs(pattern);
  const totalDurationMs = durationMinutes * 60_000;
  const bpm = cycleDurationMs > 0 ? Math.round(60_000 / cycleDurationMs) : 0;
  const totalDurationMsRef = useRef(totalDurationMs);
  totalDurationMsRef.current = totalDurationMs;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  const stopDrivers = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (backstopRef.current !== null) {
      clearInterval(backstopRef.current);
      backstopRef.current = null;
    }
  }, []);

  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    stopDrivers();
    audioEngine.stopAll();

    const total = totalDurationMsRef.current;
    const finalSnapshot = computeSnapshot(patternRef.current, total);
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      ballY: 0,
      currentPhase: 'rest',
      phaseLabel: 'Done',
      phaseProgress: 1,
      cycleCount: finalSnapshot.cycleCount,
      elapsedMs: total,
      totalDurationMs: total,
      bpm: bpmRef.current,
    }));
  }, [stopDrivers]);

  /** Single reconciliation function — every driver funnels through here. */
  const update = useCallback((now: number = performance.now()) => {
    if (finalizedRef.current || !clock.isStarted() || clock.isPaused()) return;

    const elapsed = clock.getElapsedMs(now);
    const total = totalDurationMsRef.current;

    if (elapsed >= total) {
      finalize();
      return;
    }

    const currentPattern = patternRef.current;
    const snapshot = computeSnapshot(currentPattern, elapsed);
    const step = currentPattern.steps[snapshot.stepIndex];

    // Beat-boundary tick: after a multi-beat jump (background catch-up),
    // play at most one tick — never a burst of stale ones.
    if (snapshot.beatIndex > lastBeatIndexRef.current) {
      lastBeatIndexRef.current = snapshot.beatIndex;
      if (audioEnabledRef.current) {
        const buffer = customBufferRef.current;
        if (buffer) {
          audioEngine.playBuffer(buffer);
        } else {
          audioEngine.playDefaultTick(step.phase);
        }
      }
    }

    setState({
      isRunning: true,
      isPaused: false,
      ballY: snapshot.ballY,
      currentPhase: step.phase,
      phaseLabel: step.label,
      phaseProgress: snapshot.phaseProgress,
      cycleCount: snapshot.cycleCount,
      elapsedMs: elapsed,
      totalDurationMs: total,
      currentStepIndex: snapshot.stepIndex,
      bpm: bpmRef.current,
    });
  }, [clock, finalize]);

  const startDrivers = useCallback(() => {
    stopDrivers();
    const loop = (now: number) => {
      update(now);
      if (!finalizedRef.current && clock.isStarted() && !clock.isPaused()) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    backstopRef.current = setInterval(() => update(), BACKSTOP_INTERVAL_MS);
  }, [stopDrivers, update, clock]);

  const start = useCallback(() => {
    finalizedRef.current = false;
    lastBeatIndexRef.current = -1;
    clock.start();
    setState(prev => ({ ...prev, isRunning: true, isPaused: false, totalDurationMs }));
    update();
    startDrivers();
  }, [clock, totalDurationMs, update, startDrivers]);

  const pause = useCallback(() => {
    clock.pause();
    stopDrivers();
    audioEngine.stopAll();
    setState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  }, [clock, stopDrivers]);

  const resume = useCallback(() => {
    clock.resume();
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    update();
    startDrivers();
  }, [clock, update, startDrivers]);

  const reset = useCallback(() => {
    clock.reset();
    stopDrivers();
    audioEngine.stopAll();
    finalizedRef.current = false;
    lastBeatIndexRef.current = -1;
    setState({ ...INITIAL, totalDurationMs, bpm });
  }, [clock, stopDrivers, totalDurationMs, bpm]);

  // Instant resync when the tab becomes visible/focused again (and a safety
  // sweep even while hidden — some browsers fire visibilitychange on hide).
  useEffect(() => {
    const onWake = () => update();
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [update]);

  // Sound toggle OFF mid-session: silence everything immediately.
  const prevAudioEnabledRef = useRef(audioEnabled);
  useEffect(() => {
    if (prevAudioEnabledRef.current && !audioEnabled) {
      audioEngine.stopAll();
    }
    prevAudioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Unmount: tear down drivers and release all audio resources.
  useEffect(() => () => {
    stopDrivers();
    void audioEngine.dispose();
  }, [stopDrivers]);

  useEffect(() => {
    reset();
  }, [pattern, durationMinutes, reset]);

  return { state, start, pause, resume, reset };
}
