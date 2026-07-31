import { formatIntervalLabel, formatRemaining } from '../../../shared/reminders/format.ts';
import { useRemindersEngine } from './useRemindersEngine.ts';
import { IntervalPicker } from './components/IntervalPicker.tsx';
import { PromptLibrary } from './components/PromptLibrary.tsx';
import { VolumeSlider } from './components/VolumeSlider.tsx';
import './reminders.css';

export function RemindersModule() {
  const { ready, session, settings, error, ttsAvailable, run } = useRemindersEngine();
  const controlsDisabled = !ready;

  return (
    <div className="reminders-module">
      <section className="reminders-hero">
        <h2>Mindfulness Reminders</h2>
        <p>
          Spoken mindfulness prompts on a schedule. Settings and prompts are saved in this browser —
          no extension required. Keep this tab open (or stay on FOCI Breathe) while a session is active.
        </p>
      </section>

      {!ttsAvailable && (
        <div className="banner error">
          Audio reminders are not supported in this browser (Web Speech API unavailable).
        </div>
      )}

      {error && ttsAvailable && <div className="banner error">{error}</div>}

      <section className="panel">
        <h3>Session</h3>
        <p>Status: <strong>{session.status}</strong></p>
        {session.status !== 'stopped' && (
          <p>Next reminder in {formatRemaining(session.remainingMs)}</p>
        )}
        <p className="meta">Interval: {formatIntervalLabel(settings.intervalMs)}</p>

        <div className="button-row">
          {session.status === 'stopped' && (
            <button
              type="button"
              className="primary"
              disabled={controlsDisabled || !ttsAvailable}
              onClick={() => void run({ type: 'START_SESSION' })}
            >
              Start
            </button>
          )}
          {session.status === 'active' && (
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => void run({ type: 'PAUSE_SESSION' })}
            >
              Pause
            </button>
          )}
          {session.status === 'paused' && (
            <button
              type="button"
              className="primary"
              disabled={controlsDisabled}
              onClick={() => void run({ type: 'RESUME_SESSION' })}
            >
              Resume
            </button>
          )}
          {session.status !== 'stopped' && (
            <button
              type="button"
              className="danger"
              disabled={controlsDisabled}
              onClick={() => void run({ type: 'STOP_SESSION' })}
            >
              Stop
            </button>
          )}
        </div>
      </section>

      <IntervalPicker
        intervalMs={settings.intervalMs}
        disabled={controlsDisabled}
        onChange={intervalMs => void run({ type: 'UPDATE_INTERVAL', intervalMs })}
      />

      <VolumeSlider
        volume={settings.volume}
        disabled={controlsDisabled}
        onChange={volume => void run({ type: 'UPDATE_VOLUME', volume })}
      />

      <PromptLibrary
        prompts={settings.prompts}
        disabled={controlsDisabled}
        onAdd={text => void run({ type: 'ADD_PROMPT', text })}
        onDelete={id => void run({ type: 'DELETE_PROMPT', id })}
        onEdit={(id, text) => void run({ type: 'EDIT_PROMPT', id, text })}
      />
    </div>
  );
}
