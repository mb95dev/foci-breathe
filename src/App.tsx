import { useEffect, useState, type ReactNode } from 'react';
import { PATTERNS } from './types/breathing';
import type { BreathingPattern } from './types/breathing';
import { useBreathingSession } from './hooks/useBreathingSession';
import { useTickerSound } from './hooks/useTickerSound';
import { BreathingBall } from './components/BreathingBall';
import { PhaseIndicator } from './components/PhaseIndicator';
import { PatternSelector } from './components/PatternSelector';
import { SessionControls } from './components/SessionControls';
import { SoundSettings } from './components/SoundSettings';
import { RemindersModule } from './modules/reminders/RemindersModule';
import { TechniquesModule } from './modules/techniques/TechniquesModule';
import { VirtualScroll } from './components/VirtualScroll';
import { getRemindersEngine } from './modules/reminders/webRemindersEngine';
import './App.css';

type AppModule = 'breathe' | 'reminders' | 'techniques';

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('breathe');
  const [pattern, setPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Keep the reminders engine alive across module switches so an active
    // session continues while the user is on the Breathing tab.
    getRemindersEngine();
  }, []);

  const ticker = useTickerSound();
  const { state, start, pause, resume, reset } = useBreathingSession(
    pattern, durationMinutes, audioEnabled, ticker.customBuffer,
  );

  let main: ReactNode;
  switch (activeModule) {
    case 'breathe':
      main = (
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
      );
      break;
    case 'reminders':
      main = (
        <VirtualScroll>
          <RemindersModule />
        </VirtualScroll>
      );
      break;
    case 'techniques':
      main = (
        <VirtualScroll>
          <TechniquesModule />
        </VirtualScroll>
      );
      break;
    default: {
      const _exhaustive: never = activeModule;
      throw new Error(`Unknown module: ${_exhaustive}`);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-dot" style={{ backgroundColor: pattern.color }} />
          <h1 className="title">FOCI Breathe</h1>
        </div>
        <nav className="module-nav" aria-label="Modules">
          <button
            type="button"
            className={activeModule === 'breathe' ? 'module-tab active' : 'module-tab'}
            onClick={() => setActiveModule('breathe')}
          >
            Breathing
          </button>
          <button
            type="button"
            className={activeModule === 'reminders' ? 'module-tab active' : 'module-tab'}
            onClick={() => setActiveModule('reminders')}
          >
            Reminders
          </button>
          <button
            type="button"
            className={activeModule === 'techniques' ? 'module-tab active' : 'module-tab'}
            onClick={() => setActiveModule('techniques')}
          >
            Techniques
          </button>
        </nav>
        <p className="header-sub">{headerSubtitle(activeModule)}</p>
      </header>

      {main}
    </div>
  );
}

function headerSubtitle(module: AppModule): string {
  switch (module) {
    case 'breathe':
      return 'Breathing trainer';
    case 'reminders':
      return 'Mindfulness reminders';
    case 'techniques':
      return 'Thought tools & CBT';
    default: {
      const _exhaustive: never = module;
      return _exhaustive;
    }
  }
}
