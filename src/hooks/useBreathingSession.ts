import { useCallback, useEffect, useRef, useState } from 'react';
import type { BreathingPattern, SessionState } from '../types/breathing';

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Metronome tick synthesized with Web Audio.
 * Layers a short noise burst (click transient) with a pitched tone (body),
 * both decaying rapidly for that crisp wooden-metronome character.
 */
function playTick(ctx: AudioContext, pitch: number, volume: number) {
  const now = ctx.currentTime;

  // Noise burst — the sharp "click" transient
  const bufLen = Math.floor(ctx.sampleRate * 0.015); // 15ms
  const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen); // decaying noise
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  // Bandpass filter to shape the noise into a woody click
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = pitch * 3;
  filter.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 1.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

  noiseSrc.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // Pitched tone — the resonant "body" of the tick
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, now + 0.04);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(volume * 0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noiseSrc.start(now);
  noiseSrc.stop(now + 0.025);
  osc.start(now);
  osc.stop(now + 0.05);
}

const TICK_PARAMS: Record<string, { pitch: number; volume: number }> = {
  inhale: { pitch: 1200, volume: 0.35 },  // high crisp tick — breathe in
  exhale: { pitch: 800,  volume: 0.30 },  // standard tick — breathe out
  hold:   { pitch: 600,  volume: 0.18 },  // soft low tick — hold
  rest:   { pitch: 600,  volume: 0.18 },
};

export function useBreathingSession(
  pattern: BreathingPattern,
  durationMinutes: number,
  audioEnabled: boolean,
) {
  const [state, setState] = useState<SessionState>(INITIAL);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  const totalBeats = pattern.steps.reduce((s, step) => s + step.beats, 0);
  const cycleDurationMs = totalBeats * pattern.defaultBeatMs;
  const totalDurationMs = durationMinutes * 60_000;
  const bpm = cycleDurationMs > 0 ? Math.round(60_000 / cycleDurationMs) : 0;

  const accRef = useRef({ elapsedMs: 0, phaseElapsedMs: 0, stepIndex: 0, cycleCount: 0 });

  const getStepDurationMs = useCallback(
    (stepIndex: number) => pattern.steps[stepIndex].beats * pattern.defaultBeatMs,
    [pattern],
  );

  const getStartY = useCallback(
    (stepIndex: number): number => {
      if (stepIndex === 0) {
        return pattern.steps[pattern.steps.length - 1].targetY;
      }
      return pattern.steps[stepIndex - 1].targetY;
    },
    [pattern],
  );

  const tick = useCallback((now: number) => {
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    if (delta > 200) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const acc = accRef.current;
    acc.elapsedMs += delta;
    acc.phaseElapsedMs += delta;

    const stepDuration = getStepDurationMs(acc.stepIndex);

    if (acc.phaseElapsedMs >= stepDuration) {
      acc.phaseElapsedMs -= stepDuration;
      acc.stepIndex = (acc.stepIndex + 1) % pattern.steps.length;
      if (acc.stepIndex === 0) acc.cycleCount += 1;
    }

    if (acc.elapsedMs >= totalDurationMs) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        ballY: 0,
        currentPhase: 'rest',
        phaseLabel: 'Done',
        phaseProgress: 1,
        cycleCount: acc.cycleCount,
        elapsedMs: totalDurationMs,
        totalDurationMs,
        bpm,
      }));
      return;
    }

    const step = pattern.steps[acc.stepIndex];
    const progress = Math.min(acc.phaseElapsedMs / stepDuration, 1);

    const startY = getStartY(acc.stepIndex);
    const eased = step.phase === 'hold' || step.phase === 'rest'
      ? 1
      : 0.5 - 0.5 * Math.cos(Math.PI * progress); // smooth ease-in-out
    const ballY = lerp(startY, step.targetY, eased);

    setState({
      isRunning: true,
      isPaused: false,
      ballY,
      currentPhase: step.phase,
      phaseLabel: step.label,
      phaseProgress: progress,
      cycleCount: acc.cycleCount,
      elapsedMs: acc.elapsedMs,
      totalDurationMs,
      currentStepIndex: acc.stepIndex,
      bpm,
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [pattern, totalDurationMs, bpm, getStepDurationMs, getStartY]);

  const stopMetronome = useCallback(() => {
    if (metronomeRef.current !== null) {
      clearInterval(metronomeRef.current);
      metronomeRef.current = null;
    }
  }, []);

  const startMetronome = useCallback(() => {
    stopMetronome();
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const tick = () => {
      if (audioEnabledRef.current) {
        playTick(ctx, TICK_PARAMS.inhale.pitch, TICK_PARAMS.inhale.volume);
      }
    };
    tick();
    metronomeRef.current = setInterval(tick, pattern.defaultBeatMs);
  }, [pattern.defaultBeatMs, stopMetronome]);

  const start = useCallback(() => {
    accRef.current = { elapsedMs: 0, phaseElapsedMs: 0, stepIndex: 0, cycleCount: 0 };
    lastTickRef.current = performance.now();
    setState(prev => ({ ...prev, isRunning: true, isPaused: false, totalDurationMs }));
    rafRef.current = requestAnimationFrame(tick);
    startMetronome();
  }, [tick, totalDurationMs, startMetronome]);

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopMetronome();
    setState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  }, [stopMetronome]);

  const resume = useCallback(() => {
    lastTickRef.current = performance.now();
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    rafRef.current = requestAnimationFrame(tick);
    startMetronome();
  }, [tick, startMetronome]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopMetronome();
    accRef.current = { elapsedMs: 0, phaseElapsedMs: 0, stepIndex: 0, cycleCount: 0 };
    setState({ ...INITIAL, totalDurationMs, bpm });
  }, [totalDurationMs, bpm, stopMetronome]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    stopMetronome();
  }, [stopMetronome]);

  useEffect(() => {
    reset();
  }, [pattern, durationMinutes, reset]);

  return { state, start, pause, resume, reset };
}
