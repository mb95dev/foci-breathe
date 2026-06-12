import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const stopAllMock = vi.fn();
const disposeMock = vi.fn(async () => undefined);
const playDefaultTickMock = vi.fn();
const playBufferMock = vi.fn();

vi.mock('../audio/audioEngine', () => ({
  audioEngine: {
    stopAll: () => stopAllMock(),
    dispose: () => disposeMock(),
    playDefaultTick: (phase: string) => playDefaultTickMock(phase),
    playBuffer: (buffer: AudioBuffer) => playBufferMock(buffer),
  },
}));

import { useBreathingSession } from './useBreathingSession';
import { PATTERNS } from '../types/breathing';

const focus = PATTERNS.find(p => p.id === 'foci-focus')!; // beat 2500ms, cycle 5000ms

let nowValue = 0;

beforeEach(() => {
  nowValue = 10_000;
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
  vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
  // rAF is stubbed out — tests drive updates via the backstop interval and
  // visibility events, proving correctness does not depend on rAF.
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  stopAllMock.mockClear();
  disposeMock.mockClear();
  playDefaultTickMock.mockClear();
  playBufferMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderSession(
  durationMinutes = 3,
  audioEnabled = false,
  customBuffer: AudioBuffer | null = null,
) {
  return renderHook(
    ({ audio, buffer }: { audio: boolean; buffer: AudioBuffer | null }) =>
      useBreathingSession(focus, durationMinutes, audio, buffer),
    { initialProps: { audio: audioEnabled, buffer: customBuffer } },
  );
}

describe('useBreathingSession wall-clock timing', () => {
  it('derives elapsed from the wall clock, not from tick count', () => {
    const { result } = renderSession(3);
    act(() => result.current.start());

    // 90 seconds pass but only ONE backstop callback fires
    nowValue += 90_000;
    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.state.elapsedMs).toBe(90_000);
    expect(result.current.state.isRunning).toBe(true);
    // cycle = 5000ms -> 18 full cycles
    expect(result.current.state.cycleCount).toBe(18);
  });

  it('completes on time and clamps elapsed when the clock jumps past the end', () => {
    const { result } = renderSession(1); // 60 000 ms
    act(() => result.current.start());

    nowValue += 200_000; // far past the end while "backgrounded"
    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.state.elapsedMs).toBe(60_000);
    expect(result.current.state.isRunning).toBe(false);
    expect(result.current.state.phaseLabel).toBe('Done');
    // cycle count derived from the clamped value: 60000/5000 = 12
    expect(result.current.state.cycleCount).toBe(12);
    expect(stopAllMock).toHaveBeenCalled();
  });

  it('finalization is idempotent across racing drivers', () => {
    const { result } = renderSession(1);
    act(() => result.current.start());
    nowValue += 70_000;
    act(() => { vi.advanceTimersByTime(1000); });
    stopAllMock.mockClear();

    // further backstop ticks and visibility events change nothing
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });

    expect(result.current.state.elapsedMs).toBe(60_000);
    expect(stopAllMock).not.toHaveBeenCalled();
  });

  it('resyncs immediately on visibilitychange without any timer firing', () => {
    const { result } = renderSession(3);
    act(() => result.current.start());

    nowValue += 42_000;
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });

    expect(result.current.state.elapsedMs).toBe(42_000);
  });

  it('resyncs immediately on window focus', () => {
    const { result } = renderSession(3);
    act(() => result.current.start());

    nowValue += 30_000;
    act(() => { window.dispatchEvent(new Event('focus')); });

    expect(result.current.state.elapsedMs).toBe(30_000);
  });

  it('shows completed state when session ended while backgrounded', () => {
    const { result } = renderSession(1);
    act(() => result.current.start());

    // No timers fire while "hidden"; user returns after the duration
    nowValue += 65_000;
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });

    expect(result.current.state.isRunning).toBe(false);
    expect(result.current.state.phaseLabel).toBe('Done');
    expect(result.current.state.elapsedMs).toBe(60_000);
  });

  it('never completes an infinite session', () => {
    const { result } = renderSession(Infinity);
    act(() => result.current.start());

    nowValue += 3 * 60 * 60_000; // 3 hours
    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.state.isRunning).toBe(true);
    expect(result.current.state.elapsedMs).toBe(3 * 60 * 60_000);
    expect(result.current.state.totalDurationMs).toBe(Infinity);
  });

  it('excludes paused time from elapsed', () => {
    const { result } = renderSession(3);
    act(() => result.current.start());

    nowValue += 10_000;
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => result.current.pause());

    nowValue += 30_000; // paused span
    act(() => result.current.resume());

    nowValue += 5_000;
    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.state.elapsedMs).toBe(15_000);
  });
});

describe('useBreathingSession audio lifecycle', () => {
  it('stops all audio on completion', () => {
    const { result } = renderSession(1);
    act(() => result.current.start());
    nowValue += 61_000;
    act(() => { vi.advanceTimersByTime(1000); });
    expect(stopAllMock).toHaveBeenCalled();
  });

  it('stops all audio on pause and on reset', () => {
    const { result } = renderSession(3);
    act(() => result.current.start());
    stopAllMock.mockClear();
    act(() => result.current.pause());
    expect(stopAllMock).toHaveBeenCalledTimes(1);
    act(() => result.current.reset());
    expect(stopAllMock).toHaveBeenCalledTimes(2);
  });

  it('disposes the audio engine on unmount', () => {
    const { result, unmount } = renderSession(3);
    act(() => result.current.start());
    unmount();
    expect(disposeMock).toHaveBeenCalled();
  });

  it('stops audio when the sound toggle turns OFF mid-session', () => {
    const { result, rerender } = renderSession(3, true);
    act(() => result.current.start());
    stopAllMock.mockClear();

    rerender({ audio: false, buffer: null });

    expect(stopAllMock).toHaveBeenCalled();
  });

  it('plays no ticks while audio is disabled', () => {
    const { result } = renderSession(3, false);
    act(() => result.current.start());
    nowValue += 10_000;
    act(() => { vi.advanceTimersByTime(1000); });
    expect(playDefaultTickMock).not.toHaveBeenCalled();
    expect(playBufferMock).not.toHaveBeenCalled();
  });

  it('plays at most one tick after a multi-beat jump', () => {
    const { result } = renderSession(3, true);
    act(() => result.current.start());
    expect(playDefaultTickMock).toHaveBeenCalledTimes(1); // beat 0 at start

    nowValue += 25_000; // 10 beats at 2500ms
    act(() => { vi.advanceTimersByTime(1000); });

    expect(playDefaultTickMock).toHaveBeenCalledTimes(2); // exactly one more
  });

  it('uses the custom buffer for ticks when provided', () => {
    const buffer = { duration: 0.2 } as AudioBuffer;
    const { result } = renderSession(3, true, buffer);
    act(() => result.current.start());

    expect(playBufferMock).toHaveBeenCalledWith(buffer);
    expect(playDefaultTickMock).not.toHaveBeenCalled();
  });
});
