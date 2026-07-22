import { ALARM_NAME, createScheduler } from '../shared/reminders/scheduler.ts';
import { createPromptSelector } from '../shared/reminders/promptSelector.ts';
import {
  createSettingsStore,
  type PersistedSession,
} from '../shared/reminders/settingsStore.ts';
import { createDefaultSettings } from '../shared/reminders/defaults.ts';
import { createChromeStorageAdapter } from './chromeStorage.ts';
import {
  deletePrompt,
  editPrompt,
  tryAddPrompt,
} from '../shared/reminders/validation.ts';
import type {
  BackgroundToContent,
  BackgroundToPopup,
  PopupToBackground,
  ReminderSettings,
  SessionState,
} from '../shared/reminders/types.ts';

const storage = createChromeStorageAdapter(chrome.storage.sync);
const settingsStore = createSettingsStore(storage);
const promptSelector = createPromptSelector();

let settings: ReminderSettings = createDefaultSettings();
let isSpeaking = false;

const scheduler = createScheduler({
  create(name, delayMs) {
    chrome.alarms.create(name, { when: Date.now() + delayMs });
  },
  clear(name) {
    void chrome.alarms.clear(name);
  },
});

let initPromise: Promise<void>;

async function initialize(): Promise<void> {
  settings = await settingsStore.load();
  const persisted = await settingsStore.loadSession();
  if (persisted) {
    scheduler.restore(persisted);
    await broadcastState();
  }
}

initPromise = initialize();

async function persistSession(): Promise<void> {
  const status = scheduler.getStatus();
  if (status === 'stopped') {
    await settingsStore.saveSession(undefined);
    return;
  }

  const remainingMs = scheduler.getRemainingMs(Date.now()) ?? scheduler.getIntervalMs();
  const session: PersistedSession = {
    status,
    intervalMs: scheduler.getIntervalMs(),
    remainingMs,
  };
  await settingsStore.saveSession(session);
}

function getSessionState(): SessionState {
  const status = scheduler.getStatus();
  return {
    status,
    remainingMs: status === 'active' ? scheduler.getRemainingMs(Date.now()) : status === 'paused' ? scheduler.getRemainingMs(Date.now()) : undefined,
  };
}

function stateUpdate(): BackgroundToPopup {
  return { type: 'STATE_UPDATE', session: getSessionState(), settings };
}

async function broadcastState(): Promise<void> {
  const message = stateUpdate();
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        void chrome.tabs.sendMessage(tab.id, message).catch(() => undefined);
      }
    }
  } catch {
    // Popup may not be open.
  }
}

async function speakPrompt(text: string, volume: number): Promise<void> {
  const message: BackgroundToContent = { type: 'SPEAK', text, volume };
  const tabs = await chrome.tabs.query({ audible: true, active: true });
  const targetTabs = tabs.length > 0 ? tabs : await chrome.tabs.query({ active: true, currentWindow: true });

  for (const tab of targetTabs) {
    if (tab.id === undefined) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
      return;
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
        await chrome.tabs.sendMessage(tab.id, message);
        return;
      } catch {
        // Try next tab.
      }
    }
  }
}

async function deliverReminder(): Promise<void> {
  if (settings.prompts.length === 0) {
    console.warn('[FOCI Reminders] EMPTY_LIBRARY');
    return;
  }

  isSpeaking = true;
  const prompt = promptSelector.next(settings.prompts);
  try {
    await speakPrompt(prompt.text, settings.volume);
  } finally {
    isSpeaking = false;
  }
}

async function handleAlarm(): Promise<void> {
  await initPromise;
  if (scheduler.getStatus() !== 'active' || isSpeaking) return;
  scheduler.onAlarmFired();
  await deliverReminder();
  await persistSession();
  await broadcastState();
}

async function handleCommand(message: PopupToBackground): Promise<BackgroundToPopup> {
  await initPromise;

  switch (message.type) {
    case 'GET_STATE':
      return stateUpdate();

    case 'START_SESSION':
      scheduler.start(settings.intervalMs);
      await persistSession();
      await broadcastState();
      return stateUpdate();

    case 'PAUSE_SESSION':
      scheduler.pause();
      await persistSession();
      await broadcastState();
      return stateUpdate();

    case 'RESUME_SESSION':
      scheduler.resume();
      await persistSession();
      await broadcastState();
      return stateUpdate();

    case 'STOP_SESSION':
      scheduler.stop();
      await persistSession();
      await broadcastState();
      return stateUpdate();

    case 'UPDATE_INTERVAL':
      settings = { ...settings, intervalMs: message.intervalMs };
      await settingsStore.save({ intervalMs: message.intervalMs });
      await broadcastState();
      return stateUpdate();

    case 'UPDATE_VOLUME':
      settings = { ...settings, volume: message.volume };
      await settingsStore.save({ volume: message.volume });
      await broadcastState();
      return stateUpdate();

    case 'ADD_PROMPT': {
      const result = tryAddPrompt(settings.prompts, message.text);
      if (!result.success) {
        return { type: 'ERROR', code: 'STORAGE_WRITE_ERROR', message: 'Could not add prompt.' };
      }
      settings = { ...settings, prompts: result.library };
      promptSelector.reset();
      await settingsStore.save({ prompts: result.library });
      await broadcastState();
      return stateUpdate();
    }

    case 'DELETE_PROMPT': {
      const next = deletePrompt(settings.prompts, message.id);
      settings = { ...settings, prompts: next };
      promptSelector.reset();
      await settingsStore.save({ prompts: next });
      await broadcastState();
      return stateUpdate();
    }

    case 'EDIT_PROMPT': {
      const next = editPrompt(settings.prompts, message.id, message.text);
      settings = { ...settings, prompts: next };
      promptSelector.reset();
      await settingsStore.save({ prompts: next });
      await broadcastState();
      return stateUpdate();
    }

    default: {
      const _exhaustive: never = message;
      return _exhaustive;
    }
  }
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    void handleAlarm();
  }
});

chrome.runtime.onMessage.addListener((message: PopupToBackground, _sender, sendResponse) => {
  void handleCommand(message)
    .then(sendResponse)
    .catch(() => sendResponse({
      type: 'ERROR',
      code: 'STORAGE_READ_ERROR',
      message: 'Failed to process command.',
    } satisfies BackgroundToPopup));
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  void initialize();
});

void initPromise;

export {};
