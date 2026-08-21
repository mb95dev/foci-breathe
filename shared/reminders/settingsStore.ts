import type { ReminderSettings } from './types.ts';
import { createDefaultSettings, migrateDefaultPromptsToPolish } from './defaults.ts';

export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

const SETTINGS_KEY = 'reminderSettings';
const SESSION_KEY = 'reminderSession';

export interface PersistedSession {
  readonly status: 'active' | 'paused';
  readonly intervalMs: number;
  readonly remainingMs: number;
}

export interface SettingsStore {
  load(): Promise<ReminderSettings>;
  save(settings: Partial<ReminderSettings>): Promise<void>;
  loadSession(): Promise<PersistedSession | undefined>;
  saveSession(session: PersistedSession | undefined): Promise<void>;
}

export function createSettingsStore(storage: StorageAdapter): SettingsStore {
  return {
    async load() {
      try {
        const stored = await storage.get<ReminderSettings>(SETTINGS_KEY);
        if (!stored) return createDefaultSettings();
        const prompts = migrateDefaultPromptsToPolish(
          stored.prompts?.length ? stored.prompts : createDefaultSettings().prompts,
        );
        const next: ReminderSettings = {
          ...createDefaultSettings(),
          ...stored,
          prompts,
        };
        if (JSON.stringify(prompts) !== JSON.stringify(stored.prompts ?? [])) {
          try {
            await storage.set(SETTINGS_KEY, next);
          } catch {
            // Keep migrated prompts in memory even if rewrite fails.
          }
        }
        return next;
      } catch {
        return createDefaultSettings();
      }
    },

    async save(partial) {
      const current = await this.load();
      const next: ReminderSettings = {
        intervalMs: partial.intervalMs ?? current.intervalMs,
        volume: partial.volume ?? current.volume,
        notificationMode: partial.notificationMode ?? current.notificationMode,
        prompts: partial.prompts ?? current.prompts,
      };
      await storage.set(SETTINGS_KEY, next);
    },

    async loadSession() {
      return storage.get<PersistedSession>(SESSION_KEY);
    },

    async saveSession(session) {
      if (session === undefined) {
        await storage.set(SESSION_KEY, null);
        return;
      }
      await storage.set(SESSION_KEY, session);
    },
  };
}

export function createMemoryStorageAdapter(
  initial: Record<string, unknown> = {},
): StorageAdapter {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    async get<T>(key: string) {
      return data.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T) {
      data.set(key, value);
    },
  };
}
