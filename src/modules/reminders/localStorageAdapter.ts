import type { StorageAdapter } from '../../../shared/reminders/settingsStore.ts';

const PREFIX = 'foci-reminders:';

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    async get<T>(key: string) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return undefined;
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    async set<T>(key: string, value: T) {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    },
  };
}
