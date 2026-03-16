export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export interface PhaseStep {
  readonly phase: BreathPhase;
  /** Duration relative to one beat (1.0 = full beat) */
  readonly beats: number;
  /** 0..1 where ball should be at END of this phase (0=bottom, 1=top) */
  readonly targetY: number;
  readonly label: string;
}

export interface BreathingPattern {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly steps: readonly PhaseStep[];
  readonly color: string;
  readonly accentColor: string;
  /** Default beat duration in ms */
  readonly defaultBeatMs: number;
}

export interface SessionState {
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  /** Ball Y position 0..1 (0=bottom, 1=top) — interpolated smoothly */
  readonly ballY: number;
  readonly currentPhase: BreathPhase;
  readonly phaseLabel: string;
  readonly phaseProgress: number;
  readonly cycleCount: number;
  readonly elapsedMs: number;
  readonly totalDurationMs: number;
  readonly currentStepIndex: number;
  readonly bpm: number;
}

// ── FOCI Breathing Techniques ─────────────────────────────────
// Source: decompiled FOCI app (FloatAlertUtil breathing technique dialogs)

export const PATTERNS: readonly BreathingPattern[] = [
  {
    id: 'foci-focus',
    name: 'FOCI Focus',
    subtitle: 'Double inhale + long exhale',
    description: '2 short inhales on 1 beat, 1 long exhale on 1 beat. The FOCI signature technique for deep concentration.',
    steps: [
      { phase: 'inhale', beats: 0.5, targetY: 0.6,  label: 'In' },
      { phase: 'inhale', beats: 0.5, targetY: 1.0,  label: 'In' },
      { phase: 'exhale', beats: 1.0, targetY: 0.0,  label: 'Out' },
    ],
    color: '#3b82f6',
    accentColor: '#60a5fa',
    defaultBeatMs: 2500,
  },
  {
    id: 'foci-calm',
    name: 'FOCI Calm',
    subtitle: 'Hold + inhale + long exhale',
    description: 'Hold for ½ beat, breathe in for ½ beat, breathe out for 1 beat. Activates the parasympathetic nervous system.',
    steps: [
      { phase: 'hold',   beats: 0.5, targetY: 0.0,  label: 'Hold' },
      { phase: 'inhale', beats: 0.5, targetY: 1.0,  label: 'In' },
      { phase: 'exhale', beats: 1.0, targetY: 0.0,  label: 'Out' },
    ],
    color: '#06b6d4',
    accentColor: '#22d3ee',
    defaultBeatMs: 2500,
  },
  {
    id: 'box',
    name: 'Box Breathing',
    subtitle: '4-4-4-4 equal phases',
    description: 'Equal inhale, hold, exhale, hold. Navy SEAL technique for composure under pressure.',
    steps: [
      { phase: 'inhale', beats: 1.0, targetY: 1.0,  label: 'In' },
      { phase: 'hold',   beats: 1.0, targetY: 1.0,  label: 'Hold' },
      { phase: 'exhale', beats: 1.0, targetY: 0.0,  label: 'Out' },
      { phase: 'rest',   beats: 1.0, targetY: 0.0,  label: 'Hold' },
    ],
    color: '#8b5cf6',
    accentColor: '#a78bfa',
    defaultBeatMs: 4000,
  },
  {
    id: '478',
    name: '4-7-8 Relaxation',
    subtitle: '4 in, 7 hold, 8 out',
    description: 'Dr. Weil\'s natural tranquilizer. Extended exhale deeply calms the nervous system.',
    steps: [
      { phase: 'inhale', beats: 4,  targetY: 1.0, label: 'In' },
      { phase: 'hold',   beats: 7,  targetY: 1.0, label: 'Hold' },
      { phase: 'exhale', beats: 8,  targetY: 0.0, label: 'Out' },
    ],
    color: '#a855f7',
    accentColor: '#c084fc',
    defaultBeatMs: 500,
  },
  {
    id: 'coherent',
    name: 'Coherent',
    subtitle: '5.5s in, 5.5s out',
    description: 'Equal inhale and exhale at ~5.5 BPM. Maximizes heart rate variability (HRV).',
    steps: [
      { phase: 'inhale', beats: 1.0, targetY: 1.0, label: 'In' },
      { phase: 'exhale', beats: 1.0, targetY: 0.0, label: 'Out' },
    ],
    color: '#10b981',
    accentColor: '#34d399',
    defaultBeatMs: 5500,
  },
] as const;

export const DURATION_OPTIONS = [1, 2, 3, 5, 10, 15, 20] as const;
