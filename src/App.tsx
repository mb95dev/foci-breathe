import { useState } from 'react';
import { PATTERNS } from './types/breathing';
import type { BreathingPattern } from './types/breathing';
import { useBreathingSession } from './hooks/useBreathingSession';
import { useTickerSound } from './hooks/useTickerSound';
import { BreathingBall } from './components/BreathingBall';
import { PhaseIndicator } from './components/PhaseIndicator';
import { PatternSelector } from './components/PatternSelector';
import { SessionControls } from './components/SessionControls';
import { SoundSettings } from './components/SoundSettings';
import './App.css';

export function App() {
  const [pattern, setPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const ticker = useTickerSound();
  const { state, start, pause, resume, reset } = useBreathingSession(
    pattern, durationMinutes, audioEnabled, ticker.customBuffer,
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-dot" style={{ backgroundColor: pattern.color }} />
          <h1 className="title">FOCI Breathe</h1>
        </div>
        <p className="header-sub">Breathing trainer</p>
      </header>

      <main className="main">
        <aside className="sidebar">
          <PatternSelector
            selected={pattern}
            onSelect={setPattern}
            disabled={state.isRunning}
          />
          <SessionControls
            session={state}
            durationMinutes={durationMinutes}
            audioEnabled={audioEnabled}
            onDurationChange={setDurationMinutes}
            onAudioToggle={() => setAudioEnabled(prev => !prev)}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
          />
          <SoundSettings ticker={ticker} />
        </aside>

        <section className="center">
          <PhaseIndicator session={state} pattern={pattern} />
          <BreathingBall session={state} pattern={pattern} />
        </section>
      </main>
    </div>
  );
}
