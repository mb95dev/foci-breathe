import { createScheduler, type AlarmAdapter } from '../../../shared/reminders/scheduler.ts';
import { createPromptSelector } from '../../../shared/reminders/promptSelector.ts';
import { createDefaultSettings } from '../../../shared/reminders/defaults.ts';
import {
  createSettingsStore,
  type PersistedSession,
  type SettingsStore,
} from '../../../shared/reminders/settingsStore.ts';
import {
  deletePrompt,
  editPrompt,
  tryAddPrompt,
} from '../../../shared/reminders/validation.ts';
import type {
  PopupToBackground,
  ReminderSettings,
  SessionState,
} from '../../../shared/reminders/types.ts';
import { createLocalStorageAdapter } from './localStorageAdapter.ts';
import { createVoiceEngine } from './voiceEngine.ts';

export interface RemindersSnapshot {
  readonly session: SessionState;
  readonly settings: ReminderSettings;
  readonly error: string | null;
  readonly ttsAvailable: boolean;
  readonly ready: boolean;
}

type Listener = (snapshot: RemindersSnapshot) => void;

function createTimeoutAlarmAdapter(onFire: (name: string) => void): AlarmAdapter {
  const timers = new Map<string, number>();

  return {
    create(name, delayMs) {
      const existing = timers.get(name);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }
      const id = window.setTimeout(() => {
        timers.delete(name);
        onFire(name);
      }, Math.max(0, delayMs));
      timers.set(name, id);
    },
    clear(name) {
      const existing = timers.get(name);
      if (existing !== undefined) {
        window.clearTimeout(existing);
        timers.delete(name);
      }
    },
  };
}

export class WebRemindersEngine {
  private readonly settingsStore: SettingsStore;
  private readonly promptSelector = createPromptSelector();
  private readonly voice = createVoiceEngine();
  private readonly listeners = new Set<Listener>();
  private readonly scheduler;
  private settings: ReminderSettings = createDefaultSettings();
  private error: string | null = null;
  private ready = false;
  private isSpeaking = false;
  private uiTimer: number | undefined;
  private initPromise: Promise<void>;

  constructor() {
    this.settingsStore = createSettingsStore(createLocalStorageAdapter());
    this.scheduler = createScheduler(
      createTimeoutAlarmAdapter(name => {
        if (name === 'foci-reminder') {
          void this.handleAlarm();
        }
      }),
    );
    this.initPromise = this.initialize();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): RemindersSnapshot {
    const status = this.scheduler.getStatus();
    return {
      ready: this.ready,
      error: this.error,
      ttsAvailable: this.voice.isAvailable(),
      settings: this.settings,
      session: {
        status,
        remainingMs:
          status === 'stopped'
            ? undefined
            : this.scheduler.getRemainingMs(Date.now()),
      },
    };
  }

  async dispatch(message: PopupToBackground): Promise<void> {
    await this.initPromise;

    switch (message.type) {
      case 'GET_STATE':
        this.emit();
        return;

      case 'START_SESSION':
        this.scheduler.start(this.settings.intervalMs);
        this.startUiTicker();
        await this.persistSession();
        this.emit();
        return;

      case 'PAUSE_SESSION':
        this.scheduler.pause();
        this.stopUiTicker();
        await this.persistSession();
        this.emit();
        return;

      case 'RESUME_SESSION':
        this.scheduler.resume();
        this.startUiTicker();
        await this.persistSession();
        this.emit();
        return;

      case 'STOP_SESSION':
        this.scheduler.stop();
        this.stopUiTicker();
        await this.persistSession();
        this.emit();
        return;

      case 'UPDATE_INTERVAL':
        this.settings = { ...this.settings, intervalMs: message.intervalMs };
        await this.persistSettings({ intervalMs: message.intervalMs });
        this.emit();
        return;

      case 'UPDATE_VOLUME':
        this.settings = { ...this.settings, volume: message.volume };
        await this.persistSettings({ volume: message.volume });
        this.emit();
        return;

      case 'ADD_PROMPT': {
        const result = tryAddPrompt(this.settings.prompts, message.text);
        if (!result.success) {
          this.error = result.library.length >= 100
            ? 'Prompt library is full (100 max).'
            : 'Prompt text cannot be empty.';
          this.emit();
          return;
        }
        this.settings = { ...this.settings, prompts: result.library };
        this.promptSelector.reset();
        this.error = null;
        await this.persistSettings({ prompts: result.library });
        this.emit();
        return;
      }

      case 'DELETE_PROMPT': {
        const next = deletePrompt(this.settings.prompts, message.id);
        this.settings = { ...this.settings, prompts: next };
        this.promptSelector.reset();
        await this.persistSettings({ prompts: next });
        this.emit();
        return;
      }

      case 'EDIT_PROMPT': {
        if (message.text.trim().length === 0) {
          this.error = 'Prompt text cannot be empty.';
          this.emit();
          return;
        }
        const next = editPrompt(this.settings.prompts, message.id, message.text);
        this.settings = { ...this.settings, prompts: next };
        this.promptSelector.reset();
        this.error = null;
        await this.persistSettings({ prompts: next });
        this.emit();
        return;
      }

      default: {
        const _exhaustive: never = message;
        return _exhaustive;
      }
    }
  }

  private async initialize(): Promise<void> {
    try {
      this.settings = await this.settingsStore.load();
      const persisted = await this.settingsStore.loadSession();
      if (persisted) {
        this.scheduler.restore(persisted);
        if (persisted.status === 'active') {
          this.startUiTicker();
        }
      }
      if (!this.voice.isAvailable()) {
        this.error = 'Audio reminders are not supported in this browser (Web Speech API unavailable).';
      }
    } catch {
      this.settings = createDefaultSettings();
      this.error = 'Could not load saved settings; using defaults.';
    } finally {
      this.ready = true;
      this.emit();
    }
  }

  private async handleAlarm(): Promise<void> {
    if (this.scheduler.getStatus() !== 'active' || this.isSpeaking) return;

    this.scheduler.onAlarmFired();
    await this.deliverReminder();
    await this.persistSession();
    this.emit();
  }

  private async deliverReminder(): Promise<void> {
    if (this.settings.prompts.length === 0) {
      console.warn('[FOCI Reminders] EMPTY_LIBRARY');
      return;
    }

    if (!this.voice.isAvailable()) {
      this.error = 'Audio reminders are not supported in this browser (Web Speech API unavailable).';
      this.emit();
      return;
    }

    this.isSpeaking = true;
    const prompt = this.promptSelector.next(this.settings.prompts);
    try {
      await this.voice.speak(prompt.text, this.settings.volume);
      this.error = null;
    } catch {
      this.error = 'Audio reminders are not supported in this browser (Web Speech API unavailable).';
    } finally {
      this.isSpeaking = false;
    }
  }

  private async persistSettings(partial: Partial<ReminderSettings>): Promise<void> {
    try {
      await this.settingsStore.save(partial);
    } catch {
      this.error = 'Could not save settings in this browser.';
    }
  }

  private async persistSession(): Promise<void> {
    const status = this.scheduler.getStatus();
    if (status === 'stopped') {
      await this.settingsStore.saveSession(undefined);
      return;
    }

    const session: PersistedSession = {
      status,
      intervalMs: this.scheduler.getIntervalMs(),
      remainingMs: this.scheduler.getRemainingMs(Date.now()) ?? this.scheduler.getIntervalMs(),
    };
    await this.settingsStore.saveSession(session);
  }

  private startUiTicker(): void {
    this.stopUiTicker();
    this.uiTimer = window.setInterval(() => this.emit(), 1000);
  }

  private stopUiTicker(): void {
    if (this.uiTimer !== undefined) {
      window.clearInterval(this.uiTimer);
      this.uiTimer = undefined;
    }
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}

let engineSingleton: WebRemindersEngine | undefined;

export function getRemindersEngine(): WebRemindersEngine {
  if (engineSingleton === undefined) {
    engineSingleton = new WebRemindersEngine();
  }
  return engineSingleton;
}
