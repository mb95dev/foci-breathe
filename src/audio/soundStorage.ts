const DB_NAME = 'foci-breathe';
const DB_VERSION = 1;
const STORE = 'sounds';
const RECORD_KEY = 'customTicker';
const SELECTION_KEY = 'foci-breathe:tickerSource';

export type TickerSource = 'default' | 'custom';

export interface StoredSound {
  data: ArrayBuffer;
  mimeType: string;
  name: string;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    let req: IDBRequest<T>;
    try {
      const tx = db.transaction(STORE, mode);
      tx.onabort = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB transaction aborted'));
      };
      tx.oncomplete = () => {
        db.close();
        resolve(req.result);
      };
      req = run(tx.objectStore(STORE));
      req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
    } catch (err) {
      db.close();
      reject(err);
    }
  }));
}

/** Saves (replacing any previous) the custom ticker sound bytes. */
export function saveCustomSound(sound: StoredSound): Promise<void> {
  return withStore('readwrite', store => store.put(sound, RECORD_KEY)).then(() => undefined);
}

/** Loads the stored custom ticker sound, or null when none exists. */
export function loadCustomSound(): Promise<StoredSound | null> {
  return withStore<StoredSound | undefined>('readonly', store => store.get(RECORD_KEY))
    .then(result => result ?? null);
}

/** Removes the stored custom ticker sound. Resolves even when none exists. */
export function deleteCustomSound(): Promise<void> {
  return withStore('readwrite', store => store.delete(RECORD_KEY)).then(() => undefined);
}

/** Synchronous read of the persisted ticker selection; defaults to 'default'. */
export function getTickerSource(): TickerSource {
  try {
    return localStorage.getItem(SELECTION_KEY) === 'custom' ? 'custom' : 'default';
  } catch {
    return 'default';
  }
}

/** Persists the ticker selection; no-ops when localStorage is unavailable. */
export function setTickerSource(source: TickerSource): void {
  try {
    localStorage.setItem(SELECTION_KEY, source);
  } catch {
    // storage unavailable — selection just won't survive a reload
  }
}
