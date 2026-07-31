import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createLocalStorageAdapter } from './localStorageAdapter.ts';
import { createVoiceEngine } from './voiceEngine.ts';
import { WebRemindersEngine } from './webRemindersEngine.ts';

describe('createLocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips values', async () => {
    const storage = createLocalStorageAdapter();
    await storage.set('reminderSettings', { intervalMs: 60_000, volume: 0.5, prompts: [] });
    const loaded = await storage.get<{ intervalMs: number }>('reminderSettings');
    expect(loaded?.intervalMs).toBe(60_000);
  });
});

describe('createVoiceEngine', () => {
  it('applies configured volume', async () => {
    class FakeUtterance {
      text: string;
      volume = 1;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    const spoken: FakeUtterance[] = [];
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: (utterance: FakeUtterance) => {
          spoken.push(utterance);
          queueMicrotask(() => utterance.onend?.(new Event('end')));
        },
        cancel: vi.fn(),
      },
    });

    const engine = createVoiceEngine();
    await engine.speak('What do you see?', 0.42);
    expect(spoken[0]?.volume).toBeCloseTo(0.42);
  });
});

describe('WebRemindersEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();

    class FakeUtterance {
      text: string;
      volume = 1;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: (utterance: { onend: ((event: Event) => void) | null }) => {
          queueMicrotask(() => utterance.onend?.(new Event('end')));
        },
        cancel: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('persists prompts and runs a session without an extension', async () => {
    const engine = new WebRemindersEngine();
    await vi.waitFor(() => expect(engine.snapshot().ready).toBe(true));

    await engine.dispatch({ type: 'ADD_PROMPT', text: 'What are you grateful for?' });
    expect(engine.snapshot().settings.prompts.some(p => p.text === 'What are you grateful for?')).toBe(true);

    await engine.dispatch({ type: 'UPDATE_INTERVAL', intervalMs: 60_000 });
    await engine.dispatch({ type: 'START_SESSION' });
    expect(engine.snapshot().session.status).toBe('active');

    const reloaded = new WebRemindersEngine();
    await vi.waitFor(() => expect(reloaded.snapshot().ready).toBe(true));
    expect(reloaded.snapshot().settings.prompts.some(p => p.text === 'What are you grateful for?')).toBe(true);
    expect(reloaded.snapshot().settings.intervalMs).toBe(60_000);
  });
});
