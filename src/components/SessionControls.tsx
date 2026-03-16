import type { SessionState } from '../types/breathing';
import { DURATION_OPTIONS } from '../types/breathing';

interface Props {
  session: SessionState;
  durationMinutes: number;
  audioEnabled: boolean;
  onDurationChange: (minutes: number) => void;
  onAudioToggle: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionControls({
  session, durationMinutes, audioEnabled,
  onDurationChange, onAudioToggle,
  onStart, onPause, onResume, onReset,
}: Props) {
  const isFinished = !session.isRunning && !session.isPaused
    && session.elapsedMs >= session.totalDurationMs && session.totalDurationMs > 0;

  const remaining = Math.max(0, session.totalDurationMs - session.elapsedMs);

  return (
    <div className="session-controls">
      <h3 className="section-title">Duration</h3>
      <div className="duration-row">
        {DURATION_OPTIONS.map(m => (
          <button
            key={m}
            className={`duration-btn ${m === durationMinutes ? 'active' : ''}`}
            onClick={() => onDurationChange(m)}
            disabled={session.isRunning}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="session-timer">
        <span className="timer-elapsed">{formatTime(session.elapsedMs)}</span>
        <span className="timer-sep">/</span>
        <span className="timer-total">{formatTime(session.totalDurationMs)}</span>
        {session.isRunning && (
          <span className="timer-remaining">({formatTime(remaining)} left)</span>
        )}
      </div>

      <div className="session-stats">
        <div className="stat">
          <span className="stat-value">{session.cycleCount}</span>
          <span className="stat-label">cycles</span>
        </div>
        <div className="stat">
          <span className="stat-value">{session.bpm}</span>
          <span className="stat-label">BPM</span>
        </div>
      </div>

      <button
        className={`audio-toggle ${audioEnabled ? 'on' : ''}`}
        onClick={onAudioToggle}
      >
        {audioEnabled ? 'Sound ON' : 'Sound OFF'}
      </button>

      <div className="action-row">
        {!session.isRunning && !session.isPaused && !isFinished && (
          <button className="action-btn primary" onClick={onStart}>
            Start Session
          </button>
        )}
        {session.isRunning && (
          <button className="action-btn" onClick={onPause}>
            Pause
          </button>
        )}
        {session.isPaused && (
          <>
            <button className="action-btn primary" onClick={onResume}>Resume</button>
            <button className="action-btn" onClick={onReset}>Reset</button>
          </>
        )}
        {isFinished && (
          <button className="action-btn primary" onClick={onReset}>New Session</button>
        )}
      </div>
    </div>
  );
}
