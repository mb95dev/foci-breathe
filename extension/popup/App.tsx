import { useCallback, useEffect, useState } from 'react';
import type { BackgroundToPopup, ReminderSettings, SessionState } from '../../shared/reminders/types.ts';
import { createDefaultSettings } from '../../shared/reminders/defaults.ts';
import { sendCommand } from './messaging.ts';
import { SessionPanel } from './components/SessionPanel.tsx';
import { IntervalPicker } from './components/IntervalPicker.tsx';
import { PromptLibrary } from './components/PromptLibrary.tsx';
import { VolumeSlider } from './components/VolumeSlider.tsx';

export function App() {
  const [session, setSession] = useState<SessionState>({ status: 'stopped', remainingMs: undefined });
  const [settings, setSettings] = useState<ReminderSettings>(createDefaultSettings());
  const [error, setError] = useState<string | null>(null);

  const applyResponse = useCallback((response: BackgroundToPopup) => {
    if (response.type === 'STATE_UPDATE') {
      setSession(response.session);
      setSettings(response.settings);
      setError(null);
      return;
    }
    setError(response.message);
  }, []);

  const refresh = useCallback(async () => {
    const response = await sendCommand({ type: 'GET_STATE' });
    applyResponse(response);
  }, [applyResponse]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (session.status === 'active') {
        void refresh();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [refresh, session.status]);

  const run = async (message: Parameters<typeof sendCommand>[0]) => {
    const response = await sendCommand(message);
    applyResponse(response);
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <h1>FOCI Reminders</h1>
        <p>Mindfulness prompts across your day</p>
      </header>

      {error && <div className="banner error">{error}</div>}

      <SessionPanel
        session={session}
        onStart={() => void run({ type: 'START_SESSION' })}
        onPause={() => void run({ type: 'PAUSE_SESSION' })}
        onResume={() => void run({ type: 'RESUME_SESSION' })}
        onStop={() => void run({ type: 'STOP_SESSION' })}
      />

      <IntervalPicker
        intervalMs={settings.intervalMs}
        disabled={false}
        onChange={intervalMs => void run({ type: 'UPDATE_INTERVAL', intervalMs })}
      />

      <VolumeSlider
        volume={settings.volume}
        onChange={volume => void run({ type: 'UPDATE_VOLUME', volume })}
      />

      <PromptLibrary
        prompts={settings.prompts}
        onAdd={text => void run({ type: 'ADD_PROMPT', text })}
        onDelete={id => void run({ type: 'DELETE_PROMPT', id })}
        onEdit={(id, text) => void run({ type: 'EDIT_PROMPT', id, text })}
      />
    </div>
  );
}
