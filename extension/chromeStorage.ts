import type { StorageAdapter } from '../../shared/reminders/settingsStore.ts';

export function createChromeStorageAdapter(
  area: chrome.storage.StorageArea,
): StorageAdapter {
  return {
    async get<T>(key: string) {
      const result = await area.get(key);
      return result[key] as T | undefined;
    },
    async set<T>(key: string, value: T) {
      await area.set({ [key]: value });
    },
  };
}
