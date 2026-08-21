import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createScheduler } from './scheduler.ts';
import { createPromptSelector } from './promptSelector.ts';
import {
  addPrompt,
  deletePrompt,
  editPrompt,
  tryAddPrompt,
  validateIntervalMinutes,
  validatePromptText,
} from './validation.ts';
import { createSettingsStore, createMemoryStorageAdapter } from './settingsStore.ts';
import type { Prompt } from './types.ts';

function makeMockAlarms() {
  const alarms = new Map<string, number>();
  return {
    adapter: {
      create(name: string, delayMs: number) {
        alarms.set(name, delayMs);
      },
      clear(name: string) {
        alarms.delete(name);
      },
    },
    alarms,
  };
}

const promptArb = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
}) as fc.Arbitrary<Prompt>;

describe('scheduler', () => {
  it('starts with full interval remaining', () => {
    const { adapter } = makeMockAlarms();
    const scheduler = createScheduler(adapter);
    const intervalMs = 120_000;
    const now = Date.now();
    scheduler.start(intervalMs);
    expect(Math.abs(scheduler.getRemainingMs(now)! - intervalMs)).toBeLessThan(10);
  });

  // Feature: mindfulness-reminders, Property 1: Scheduler initial countdown accuracy
  it('property: initial countdown accuracy', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60_000, max: 28_800_000 }), intervalMs => {
        const { adapter } = makeMockAlarms();
        const scheduler = createScheduler(adapter);
        const now = Date.now();
        scheduler.start(intervalMs);
        return Math.abs(scheduler.getRemainingMs(now)! - intervalMs) < 10;
      }),
    );
  });

  // Feature: mindfulness-reminders, Property 2: Pause / resume countdown round-trip
  it('property: pause/resume preserves remaining time', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60_000, max: 28_800_000 }), intervalMs => {
        const { adapter } = makeMockAlarms();
        const scheduler = createScheduler(adapter);
        scheduler.start(intervalMs);
        const remainingBefore = scheduler.getRemainingMs(Date.now())!;
        scheduler.pause();
        const pausedRemaining = scheduler.getRemainingMs(Date.now())!;
        scheduler.resume();
        const remainingAfter = scheduler.getRemainingMs(Date.now())!;
        return (
          Math.abs(pausedRemaining - remainingBefore) < 10
          && Math.abs(remainingAfter - pausedRemaining) < 50
        );
      }),
    );
  });
});

describe('promptSelector', () => {
  // Feature: mindfulness-reminders, Property 3: Prompt non-repetition invariant
  it('property: avoids consecutive repeats when library > 1', () => {
    fc.assert(
      fc.property(
        fc.array(promptArb, { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 2, max: 100 }),
        (library, callCount) => {
          const selector = createPromptSelector();
          let prev: string | undefined;
          for (let i = 0; i < callCount; i += 1) {
            const prompt = selector.next(library);
            if (prev !== undefined && prompt.id === prev) return false;
            prev = prompt.id;
          }
          return true;
        },
      ),
    );
  });

  // Feature: mindfulness-reminders, Property 4: Prompt cycle completeness
  it('property: full cycle covers every prompt once', () => {
    fc.assert(
      fc.property(fc.array(promptArb, { minLength: 1, maxLength: 20 }), library => {
        const selector = createPromptSelector();
        const seen = new Set<string>();
        for (let i = 0; i < library.length; i += 1) {
          seen.add(selector.next(library).id);
        }
        return seen.size === library.length;
      }),
    );
  });
});

describe('validation', () => {
  // Feature: mindfulness-reminders, Property 5
  it('property: rejects whitespace-only prompt text', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\s*$/), text => validatePromptText(text) === false),
    );
  });

  // Feature: mindfulness-reminders, Property 6
  it('property: interval validation partitions domain', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 480 }), n => validateIntervalMinutes(n) === true),
    );
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 481, max: 10_000 })),
        n => validateIntervalMinutes(n) === false,
      ),
    );
  });

  // Feature: mindfulness-reminders, Property 8
  it('property: enforces 100 prompt cap', () => {
    fc.assert(
      fc.property(
        fc.array(promptArb, { minLength: 100, maxLength: 100 }),
        promptArb,
        (library, extra) => {
          const result = tryAddPrompt(library, extra.text);
          return result.success === false && result.library.length === 100;
        },
      ),
    );
  });

  // Feature: mindfulness-reminders, Property 9
  it('property: CRUD mutations reflected in library', () => {
    fc.assert(
      fc.property(
        fc.array(promptArb, { minLength: 0, maxLength: 99 }),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (library, text) => addPrompt(library, text).some(p => p.text === text.trim()),
      ),
    );
    fc.assert(
      fc.property(fc.array(promptArb, { minLength: 1, maxLength: 100 }), library => {
        const target = library[0];
        const after = deletePrompt(library, target.id);
        return !after.some(p => p.id === target.id);
      }),
    );
    fc.assert(
      fc.property(
        fc.array(promptArb, { minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (library, newText) => {
          const target = library[0];
          const after = editPrompt(library, target.id, newText);
          return after.find(p => p.id === target.id)?.text === newText.trim();
        },
      ),
    );
  });
});

describe('settingsStore', () => {
  it('migrates shipped English default prompts to Polish on load', async () => {
    const store = createSettingsStore(createMemoryStorageAdapter({
      reminderSettings: {
        intervalMs: 60_000,
        volume: 0.5,
        notificationMode: 'voice',
        prompts: [
          { id: 'default-see', text: 'What do you see?' },
          { id: 'custom-1', text: 'Zatrzymaj się na chwilę' },
        ],
      },
    }));

    const loaded = await store.load();
    expect(loaded.prompts).toEqual([
      { id: 'default-see', text: 'Co widzisz?' },
      { id: 'custom-1', text: 'Zatrzymaj się na chwilę' },
    ]);
  });

  // Feature: mindfulness-reminders, Property 7
  it('property: settings persistence round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          intervalMs: fc.integer({ min: 60_000, max: 28_800_000 }),
          volume: fc.float({ min: 0, max: 1 }),
          notificationMode: fc.constantFrom('voice', 'beep'),
          prompts: fc.array(promptArb, { minLength: 1, maxLength: 10 }),
        }),
        async settings => {
          const store = createSettingsStore(createMemoryStorageAdapter());
          await store.save(settings);
          const loaded = await store.load();
          return JSON.stringify(loaded) === JSON.stringify(settings);
        },
      ),
      { numRuns: 50 },
    );
  });
});
