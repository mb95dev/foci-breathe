import type { Prompt, ReminderSettings } from './types.ts';

export const DEFAULT_PROMPTS: Prompt[] = [
  { id: 'default-see', text: 'What do you see?' },
  { id: 'default-hear', text: 'What do you hear?' },
  { id: 'default-feel', text: 'What do you feel?' },
  { id: 'default-smell', text: 'What do you smell?' },
  { id: 'default-body', text: 'What do you notice in your body right now?' },
];

export const DEFAULT_INTERVAL_MS = 30 * 60_000;
export const DEFAULT_VOLUME = 0.8;
export const MAX_PROMPTS = 100;

export const INTERVAL_PRESETS_MS = [
  5 * 60_000,
  10 * 60_000,
  15 * 60_000,
  30 * 60_000,
  60 * 60_000,
  120 * 60_000,
] as const;

export function createDefaultSettings(): ReminderSettings {
  return {
    intervalMs: DEFAULT_INTERVAL_MS,
    volume: DEFAULT_VOLUME,
    prompts: [...DEFAULT_PROMPTS],
  };
}
