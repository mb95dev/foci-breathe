import { formatRemaining } from '../../../shared/reminders/format.ts';
import type { SessionState } from '../../../shared/reminders/types.ts';

interface Props {
  session: SessionState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function SessionPanel({ session, onStart, onPause, onResume, onStop }: Props) {
  const statusLabel = session.status.charAt(0).toUpperCase() + session.status.slice(1);

  return (
    <section className="panel">
      <h2>Session</h2>
      <p className="status-line">
        Status: <strong>{statusLabel}</strong>
      </p>
      {session.status === 'active' && (
        <p className="countdown">Next reminder in {formatRemaining(session.remainingMs)}</p>
      )}
      {session.status === 'paused' && (
        <p className="countdown">Paused at {formatRemaining(session.remainingMs)}</p>
      )}

      <div className="button-row">
        {session.status === 'stopped' && (
          <button type="button" className="primary" onClick={onStart}>Start</button>
        )}
        {session.status === 'active' && (
          <button type="button" onClick={onPause}>Pause</button>
        )}
        {session.status === 'paused' && (
          <button type="button" className="primary" onClick={onResume}>Resume</button>
        )}
        {session.status !== 'stopped' && (
          <button type="button" className="danger" onClick={onStop}>Stop</button>
        )}
      </div>
    </section>
  );
}
