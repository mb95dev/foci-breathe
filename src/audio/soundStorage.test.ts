import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  deleteCustomSound,
  getTickerSource,
  loadCustomSound,
  saveCustomSound,
  setTickerSource,
  type StoredSound,
} from './soundStorage';

function makeSound(fill: number, name = 'tick.mp3'): StoredSound {
  const data = new Uint8Array([fill, fill + 1, fill + 2, fill + 3]).buffer;
  return { data, mimeType: 'audio/mpeg', name, savedAt: 1718000000000 };
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('soundStorage IndexedDB', () => {
  it('save/load round-trip preserves bytes and metadata', async () => {
    const sound = makeSound(10);
    await saveCustomSound(sound);
    const loaded = await loadCustomSound();
    expect(loaded).not.toBeNull();
    expect(new Uint8Array(loaded!.data)).toEqual(new Uint8Array([10, 11, 12, 13]));
    expect(loaded!.mimeType).toBe('audio/mpeg');
    expect(loaded!.name).toBe('tick.mp3');
    expect(loaded!.savedAt).toBe(1718000000000);
  });

  it('saving twice replaces the existing record', async () => {
    await saveCustomSound(makeSound(1, 'first.wav'));
    await saveCustomSound(makeSound(50, 'second.ogg'));
    const loaded = await loadCustomSound();
    expect(loaded!.name).toBe('second.ogg');
    expect(new Uint8Array(loaded!.data)[0]).toBe(50);
  });

  it('load returns null when nothing is stored', async () => {
    await expect(loadCustomSound()).resolves.toBeNull();
  });

  it('delete removes the record', async () => {
    await saveCustomSound(makeSound(7));
    await deleteCustomSound();
    await expect(loadCustomSound()).resolves.toBeNull();
  });

  it('delete resolves when nothing is stored', async () => {
    await expect(deleteCustomSound()).resolves.toBeUndefined();
  });

  it('rejects cleanly when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(saveCustomSound(makeSound(1))).rejects.toThrow();
    await expect(loadCustomSound()).rejects.toThrow();
    await expect(deleteCustomSound()).rejects.toThrow();
  });
});

describe('ticker source selection (localStorage)', () => {
  it('defaults to "default" when nothing is stored', () => {
    expect(getTickerSource()).toBe('default');
  });

  it('round-trips the selection', () => {
    setTickerSource('custom');
    expect(getTickerSource()).toBe('custom');
    setTickerSource('default');
    expect(getTickerSource()).toBe('default');
  });

  it('treats unknown stored values as "default"', () => {
    localStorage.setItem('foci-breathe:tickerSource', 'garbage');
    expect(getTickerSource()).toBe('default');
  });

  it('does not throw when localStorage access fails', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(getTickerSource()).toBe('default');
    expect(() => setTickerSource('custom')).not.toThrow();
    getSpy.mockRestore();
    setSpy.mockRestore();
  });
});
