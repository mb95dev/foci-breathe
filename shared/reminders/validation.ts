import { MAX_PROMPTS } from './defaults.ts';
import type { Prompt } from './types.ts';

export function validatePromptText(text: string): boolean {
  return text.trim().length > 0;
}

export function validateIntervalMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 480;
}

export function minutesToMs(minutes: number): number {
  return minutes * 60_000;
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

export function createPromptId(): string {
  return crypto.randomUUID();
}

export function addPrompt(library: readonly Prompt[], text: string): Prompt[] {
  if (!validatePromptText(text) || library.length >= MAX_PROMPTS) {
    return [...library];
  }
  return [...library, { id: createPromptId(), text: text.trim() }];
}

export function tryAddPrompt(
  library: readonly Prompt[],
  text: string,
): { success: boolean; library: Prompt[] } {
  if (!validatePromptText(text)) {
    return { success: false, library: [...library] };
  }
  if (library.length >= MAX_PROMPTS) {
    return { success: false, library: [...library] };
  }
  return { success: true, library: addPrompt(library, text) };
}

export function deletePrompt(library: readonly Prompt[], id: string): Prompt[] {
  return library.filter(p => p.id !== id);
}

export function editPrompt(
  library: readonly Prompt[],
  id: string,
  text: string,
): Prompt[] {
  if (!validatePromptText(text)) {
    return [...library];
  }
  return library.map(p => (p.id === id ? { ...p, text: text.trim() } : p));
}
