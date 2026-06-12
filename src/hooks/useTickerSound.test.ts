import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';

const decodeMock = vi.fn();
const playBufferMock = vi.fn();
const playDefaultTickMock = vi.fn();

vi.mock('../audio/audioEngine', () => ({
  audioEngine: {
    decode: (data: ArrayBuffer) => decodeMock(data),
    playBuffer: (buffer: AudioBuffer) => playBufferMock(buffer),
    playDefaultTick: (phase: string) => playDefaultTickMock(phase),
  },
}));

import { useTickerSound, MAX_SOUND_BYTES } from './useTickerSound';
import { loadCustomSound, saveCustomSound, getTickerSource, setTickerSource } from '../audio/soundStorage';

const FAKE_BUFFER = { duration: 0.2 } as AudioBuffer;

function makeFile(
  name = 'tick.mp3',
  type = 'audio/mpeg',
  bytes: number = 1024,
): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  localStorage.clear();
  decodeMock.mockReset().mockResolvedValue(FAKE_BUFFER);
  playBufferMock.mockReset();
  playDefaultTickMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTickerSound upload', () => {
  it('happy path: decodes, activates, and persists the sound', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile()));

    expect(result.current.source).toBe('custom');
    expect(result.current.customBuffer).toBe(FAKE_BUFFER);
    expect(result.current.customSoundName).toBe('tick.mp3');
    expect(result.current.error).toBeNull();
    expect(getTickerSource()).toBe('custom');
    const stored = await loadCustomSound();
    expect(stored?.name).toBe('tick.mp3');
  });

  it('rejects unsupported file types without touching state', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('doc.pdf', 'application/pdf')));

    expect(result.current.error).toMatch(/MP3, WAV, or OGG/);
    expect(result.current.source).toBe('default');
    expect(result.current.customBuffer).toBeNull();
    expect(getTickerSource()).toBe('default');
  });

  it('accepts by extension when the MIME type is empty', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('tick.ogg', '')));
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBe('custom');
  });

  it('rejects files over the 2 MB limit and states the limit', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('big.mp3', 'audio/mpeg', MAX_SOUND_BYTES + 1)));

    expect(result.current.error).toMatch(/2 MB/);
    expect(result.current.source).toBe('default');
  });

  it('rejects undecodable audio and keeps prior state', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('good.mp3')));
    expect(result.current.source).toBe('custom');

    decodeMock.mockRejectedValueOnce(new Error('bad data'));
    await act(() => result.current.uploadFile(makeFile('bad.mp3')));

    expect(result.current.error).toMatch(/could not be decoded/);
    expect(result.current.source).toBe('custom');
    expect(result.current.customSoundName).toBe('good.mp3');
    expect(result.current.customBuffer).toBe(FAKE_BUFFER);
  });

  it('keeps the sound usable with a notice when persistence fails', async () => {
    vi.stubGlobal('indexedDB', undefined); // IDB unavailable -> save rejects
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile()));

    expect(result.current.source).toBe('custom');
    expect(result.current.customBuffer).toBe(FAKE_BUFFER);
    expect(result.current.notice).toMatch(/could not be saved/);
  });
});

describe('useTickerSound restore on mount', () => {
  it('restores a persisted custom sound', async () => {
    await saveCustomSound({
      data: new Uint8Array([1, 2, 3]).buffer,
      mimeType: 'audio/mpeg',
      name: 'saved.mp3',
      savedAt: Date.now(),
    });
    setTickerSource('custom');

    const { result } = renderHook(() => useTickerSound());
    await waitFor(() => expect(result.current.source).toBe('custom'));
    expect(result.current.customSoundName).toBe('saved.mp3');
    expect(result.current.customBuffer).toBe(FAKE_BUFFER);
  });

  it('falls back to default with a notice when the record is missing', async () => {
    setTickerSource('custom'); // flag set but no IDB record

    const { result } = renderHook(() => useTickerSound());
    await waitFor(() => expect(result.current.notice).toMatch(/could not be restored/));
    expect(result.current.source).toBe('default');
    expect(getTickerSource()).toBe('default');
  });

  it('falls back to default when stored data fails to decode', async () => {
    await saveCustomSound({
      data: new Uint8Array([9]).buffer,
      mimeType: 'audio/mpeg',
      name: 'corrupt.mp3',
      savedAt: Date.now(),
    });
    setTickerSource('custom');
    decodeMock.mockRejectedValue(new Error('corrupt'));

    const { result } = renderHook(() => useTickerSound());
    await waitFor(() => expect(result.current.notice).toMatch(/could not be restored/));
    expect(result.current.source).toBe('default');
    expect(getTickerSource()).toBe('default');
    await waitFor(async () => expect(await loadCustomSound()).toBeNull());
  });

  it('does nothing when the selection flag is default', async () => {
    const { result } = renderHook(() => useTickerSound());
    expect(result.current.source).toBe('default');
    expect(result.current.notice).toBeNull();
  });
});

describe('useTickerSound preview and revert', () => {
  it('preview plays the custom buffer when active', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile()));
    act(() => result.current.preview());
    expect(playBufferMock).toHaveBeenCalledWith(FAKE_BUFFER);
  });

  it('preview plays the default tick when no custom sound is active', () => {
    const { result } = renderHook(() => useTickerSound());
    act(() => result.current.preview());
    expect(playDefaultTickMock).toHaveBeenCalledWith('inhale');
  });

  it('revert restores default immediately and deletes the stored record', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile()));
    expect(result.current.source).toBe('custom');

    await act(() => result.current.revertToDefault());

    expect(result.current.source).toBe('default');
    expect(result.current.customBuffer).toBeNull();
    expect(result.current.customSoundName).toBeNull();
    expect(getTickerSource()).toBe('default');
    await expect(loadCustomSound()).resolves.toBeNull();
  });

  it('uploading a new sound replaces the previous one', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('first.mp3')));
    await act(() => result.current.uploadFile(makeFile('second.wav', 'audio/wav')));

    expect(result.current.customSoundName).toBe('second.wav');
    const stored = await loadCustomSound();
    expect(stored?.name).toBe('second.wav');
  });

  it('dismissMessage clears error and notice', async () => {
    const { result } = renderHook(() => useTickerSound());
    await act(() => result.current.uploadFile(makeFile('doc.pdf', 'application/pdf')));
    expect(result.current.error).not.toBeNull();
    act(() => result.current.dismissMessage());
    expect(result.current.error).toBeNull();
  });
});
