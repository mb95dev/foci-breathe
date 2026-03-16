import type { BreathingPattern, SessionState } from '../types/breathing';

interface Props {
  session: SessionState;
  pattern: BreathingPattern;
}

export function PhaseIndicator({ session, pattern }: Props) {
  const step = pattern.steps[session.currentStepIndex];

  const remaining = session.isRunning && step
    ? ((1 - session.phaseProgress) * step.beats * pattern.defaultBeatMs / 1000).toFixed(1)
    : null;

  return (
    <div className="phase-indicator">
      <div
        className="phase-label"
        style={{ color: session.isRunning ? pattern.accentColor : 'var(--text-dim)' }}
      >
        {session.phaseLabel}
      </div>
      {remaining !== null && (
        <div className="phase-countdown">{remaining}s</div>
      )}
      <div className="phase-steps">
        {pattern.steps.map((s, i) => (
          <div
            key={i}
            className={`phase-dot ${i === session.currentStepIndex && session.isRunning ? 'active' : ''}`}
            style={{
              backgroundColor: i === session.currentStepIndex && session.isRunning
                ? pattern.color
                : 'rgba(255,255,255,0.12)',
              width: `${Math.max(s.beats * 16, 8)}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
