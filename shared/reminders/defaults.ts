import type { Prompt, ReminderSettings } from './types.ts';

export const DEFAULT_PROMPTS: Prompt[] = [
  { id: 'default-see', text: 'Co widzisz?' },
  { id: 'default-hear', text: 'Co słyszysz?' },
  { id: 'default-feel', text: 'Co czujesz?' },
  { id: 'default-smell', text: 'Jaki zapach czujesz?' },
  { id: 'default-body', text: 'Co zauważasz teraz w ciele?' },
];

const LEGACY_ENGLISH_DEFAULTS: Readonly<Record<string, string>> = {
  'default-see': 'What do you see?',
  'default-hear': 'What do you hear?',
  'default-feel': 'What do you feel?',
  'default-smell': 'What do you smell?',
  'default-body': 'What do you notice in your body right now?',
};

export function migrateDefaultPromptsToPolish(prompts: readonly Prompt[]): Prompt[] {
  const polishById = new Map(DEFAULT_PROMPTS.map(prompt => [prompt.id, prompt.text]));
  return prompts.map(prompt => {
    const polish = polishById.get(prompt.id);
    const english = LEGACY_ENGLISH_DEFAULTS[prompt.id];
    if (polish && english && prompt.text === english) {
      return { id: prompt.id, text: polish };
    }
    return prompt;
  });
}

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
    notificationMode: 'voice',
    prompts: [...DEFAULT_PROMPTS],
  };
}
