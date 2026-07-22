import { formatIntervalLabel, formatRemaining } from '../../../shared/reminders/format.ts';
import { useExtensionBridge } from './useExtensionBridge.ts';
import { IntervalPicker } from './components/IntervalPicker.tsx';
import { PromptLibrary } from './components/PromptLibrary.tsx';
import { VolumeSlider } from './components/VolumeSlider.tsx';
import './reminders.css';

export function RemindersModule() {
  const { connected, session, settings, error, run } = useExtensionBridge();

  return (
    <div className="reminders-module">
      <section className="reminders-hero">
        <h2>Mindfulness Reminders</h2>
        <p>
          Pair the FOCI Breathe web app with the Chrome extension to receive spoken mindfulness
          prompts while you work anywhere in the browser.
        </p>
      </section>

      <section className="panel extension-status">
        <h3>Extension connection</h3>
        <p className={connected ? 'status ok' : 'status warn'}>
          {connected ? 'Connected to FOCI Mindfulness Reminders extension' : 'Extension not detected on this page'}
        </p>
        {!connected && (
          <ol className="install-steps">
            <li>Run <code>npm run build:extension</code> in this repository.</li>
            <li>Open <code>chrome://extensions</code> and enable Developer mode.</li>
            <li>Click <strong>Load unpacked</strong> and select the <code>extension/dist</code> folder.</li>
            <li>Reload this page after installing the extension.</li>
          </ol>
        )}
      </section>

      {error && <div className="banner error">{error}</div>}

      <section className="panel">
        <h3>Session</h3>
        <p>Status: <strong>{session.status}</strong></p>
        {session.status !== 'stopped' && (
          <p>Next reminder in {formatRemaining(session.remainingMs)}</p>
        )}
        <p className="meta">Interval: {formatIntervalLabel(settings.intervalMs)}</p>

        <div className="button-row">
          {session.status === 'stopped' && (
            <button type="button" className="primary" disabled={!connected} onClick={() => void run({ type: 'START_SESSION' })}>
              Start
            </button>
          )}
          {session.status === 'active' && (
            <button type="button" disabled={!connected} onClick={() => void run({ type: 'PAUSE_SESSION' })}>Pause</button>
          )}
          {session.status === 'paused' && (
            <button type="button" className="primary" disabled={!connected} onClick={() => void run({ type: 'RESUME_SESSION' })}>Resume</button>
          )}
          {session.status !== 'stopped' && (
            <button type="button" className="danger" disabled={!connected} onClick={() => void run({ type: 'STOP_SESSION' })}>Stop</button>
          )}
        </div>
      </section>

      <IntervalPicker
        intervalMs={settings.intervalMs}
        disabled={!connected}
        onChange={intervalMs => void run({ type: 'UPDATE_INTERVAL', intervalMs })}
      />

      <VolumeSlider
        volume={settings.volume}
        disabled={!connected}
        onChange={volume => void run({ type: 'UPDATE_VOLUME', volume })}
      />

      <PromptLibrary
        prompts={settings.prompts}
        disabled={!connected}
        onAdd={text => void run({ type: 'ADD_PROMPT', text })}
        onDelete={id => void run({ type: 'DELETE_PROMPT', id })}
        onEdit={(id, text) => void run({ type: 'EDIT_PROMPT', id, text })}
      />
    </div>
  );
}
