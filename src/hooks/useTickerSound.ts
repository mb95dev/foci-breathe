import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import {
  deleteCustomSound,
  getTickerSource,
  loadCustomSound,
  saveCustomSound,
  setTickerSource,
  type TickerSource,
} from '../audio/soundStorage';

export const MAX_SOUND_BYTES = 2 * 1024 * 1024; // 2 MB

const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
];
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.ogg'];

export interface TickerSoundApi {
  source: TickerSource;
  customSoundName: string | null;
  /** Decoded custom ticker buffer, consumed by useBreathingSession. */
  customBuffer: AudioBuffer | null;
  /** Validation/decode errors (blocking, red). */
  error: string | null;
  /** Non-blocking notices, e.g. persistence failures (amber). */
  notice: string | null;
  uploadFile(file: File): Promise<void>;
  preview(): void;
  revertToDefault(): Promise<void>;
  dismissMessage(): void;
}

function isAcceptedType(file: File): boolean {
  if (file.type) {
    return ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase());
  }
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext));
}

export function useTickerSound(): TickerSoundApi {
  const [source, setSource] = useState<TickerSource>('default');
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);
  const [customBuffer, setCustomBuffer] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Restore a persisted custom sound on mount; never blocks first render.
  useEffect(() => {
    mountedRef.current = true;
    if (getTickerSource() !== 'custom') {
      return () => { mountedRef.current = false; };
    }
    (async () => {
      try {
        const stored = await loadCustomSound();
        if (!stored) throw new Error('No stored sound');
        const buffer = await audioEngine.decode(stored.data);
        if (!mountedRef.current) return;
        setCustomBuffer(buffer);
        setCustomSoundName(stored.name);
        setSource('custom');
      } catch {
        setTickerSource('default');
        deleteCustomSound().catch(() => undefined);
        if (mountedRef.current) {
          setNotice('Your custom ticker sound could not be restored — using the default sound.');
        }
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setNotice(null);

    if (!isAcceptedType(file)) {
      setError('Unsupported file type. Please choose an MP3, WAV, or OGG file.');
      return;
    }
    if (file.size > MAX_SOUND_BYTES) {
      setError('File is too large. The maximum size is 2 MB.');
      return;
    }

    let data: ArrayBuffer;
    let buffer: AudioBuffer;
    try {
      data = await file.arrayBuffer();
      buffer = await audioEngine.decode(data);
    } catch {
      setError('This file could not be decoded as playable audio. Your current sound is unchanged.');
      return;
    }

    if (!mountedRef.current) return;

    // Activate in memory first so the sound is usable even if persistence fails.
    setCustomBuffer(buffer);
    setCustomSoundName(file.name);
    setSource('custom');

    try {
      await saveCustomSound({
        data,
        mimeType: file.type || 'audio/mpeg',
        name: file.name,
        savedAt: Date.now(),
      });
      setTickerSource('custom');
    } catch {
      if (mountedRef.current) {
        setNotice('Sound is active for this session, but it could not be saved for next time.');
      }
    }
  }, []);

  const preview = useCallback(() => {
    if (source === 'custom' && customBuffer) {
      audioEngine.playBuffer(customBuffer);
    } else {
      audioEngine.playDefaultTick('inhale');
    }
  }, [source, customBuffer]);

  const revertToDefault = useCallback(async () => {
    setSource('default');
    setCustomBuffer(null);
    setCustomSoundName(null);
    setError(null);
    setNotice(null);
    setTickerSource('default');
    try {
      await deleteCustomSound();
    } catch {
      // best-effort cleanup; selection flag already reverted
    }
  }, []);

  const dismissMessage = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  return {
    source,
    customSoundName,
    customBuffer,
    error,
    notice,
    uploadFile,
    preview,
    revertToDefault,
    dismissMessage,
  };
}
