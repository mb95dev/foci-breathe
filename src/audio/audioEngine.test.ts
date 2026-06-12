import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class StubNode {
  started = false;
  stopped = false;
  disconnected = false;
  buffer: unknown = null;
  type = '';
  frequency = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  Q = { value: 0 };
  gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  onended: (() => void) | null = null;
  throwOnStop = false;

  connect = vi.fn();
  disconnect = vi.fn(() => { this.disconnected = true; });
  start = vi.fn(() => { this.started = true; });
  stop = vi.fn(() => {
    if (this.throwOnStop) throw new DOMException('already stopped', 'InvalidStateError');
    this.stopped = true;
  });
}

class StubAudioContext {
  static instances: StubAudioContext[] = [];
  state = 'running';
  currentTime = 0;
  sampleRate = 44_100;
  destination = {};
  createdSources: StubNode[] = [];
  createdOscillators: StubNode[] = [];

  constructor() {
    StubAudioContext.instances.push(this);
  }

  createBuffer() {
    return { getChannelData: () => new Float32Array(16) };
  }
  createBufferSource() {
    const node = new StubNode();
    this.createdSources.push(node);
    return node;
  }
  createOscillator() {
    const node = new StubNode();
    this.createdOscillators.push(node);
    return node;
  }
  createBiquadFilter() {
    return new StubNode();
  }
  createGain() {
    return new StubNode();
  }
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  decodeAudioData = vi.fn(async (data: ArrayBuffer) => {
    if (data.byteLength === 0) throw new DOMException('decode failed', 'EncodingError');
    return { duration: 1 } as AudioBuffer;
  });
}

// The engine module is imported fresh per test so the singleton has no
// leftover context/node state.
async function freshEngine() {
  vi.resetModules();
  const mod = await import('./audioEngine');
  return mod.audioEngine;
}

beforeEach(() => {
  StubAudioContext.instances = [];
  vi.stubGlobal('AudioContext', StubAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AudioEngine', () => {
  it('creates the AudioContext lazily and reuses it', async () => {
    const engine = await freshEngine();
    expect(StubAudioContext.instances).toHaveLength(0);
    engine.playDefaultTick('inhale');
    engine.playDefaultTick('exhale');
    expect(StubAudioContext.instances).toHaveLength(1);
  });

  it('starts and tracks nodes for default ticks', async () => {
    const engine = await freshEngine();
    engine.playDefaultTick('inhale');
    const ctx = StubAudioContext.instances[0];
    expect(ctx.createdSources[0].started).toBe(true);
    expect(ctx.createdOscillators[0].started).toBe(true);
  });

  it('plays a custom buffer through a tracked source node', async () => {
    const engine = await freshEngine();
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const ctx = StubAudioContext.instances[0];
    expect(ctx.createdSources).toHaveLength(1);
    expect(ctx.createdSources[0].started).toBe(true);
  });

  it('stopAll stops and disconnects every live node', async () => {
    const engine = await freshEngine();
    engine.playDefaultTick('inhale');
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const ctx = StubAudioContext.instances[0];
    engine.stopAll();
    for (const node of [...ctx.createdSources, ...ctx.createdOscillators]) {
      expect(node.stopped).toBe(true);
      expect(node.disconnected).toBe(true);
    }
  });

  it('stopAll clears the registry so a second call is a no-op', async () => {
    const engine = await freshEngine();
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const node = StubAudioContext.instances[0].createdSources[0];
    engine.stopAll();
    node.stop.mockClear();
    engine.stopAll();
    expect(node.stop).not.toHaveBeenCalled();
  });

  it('removes nodes from the registry when they end naturally', async () => {
    const engine = await freshEngine();
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const node = StubAudioContext.instances[0].createdSources[0];
    node.onended?.(); // simulate natural end
    engine.stopAll();
    expect(node.stopped).toBe(false); // was already removed, not stopped again
  });

  it('swallows InvalidStateError from already-ended nodes in stopAll', async () => {
    const engine = await freshEngine();
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const ctx = StubAudioContext.instances[0];
    ctx.createdSources[0].throwOnStop = true;
    expect(() => engine.stopAll()).not.toThrow();
    // the other node is still stopped despite the first throwing
    expect(ctx.createdSources[1].stopped).toBe(true);
  });

  it('dispose stops all nodes and closes the context', async () => {
    const engine = await freshEngine();
    engine.playBuffer({ duration: 1 } as AudioBuffer);
    const ctx = StubAudioContext.instances[0];
    await engine.dispose();
    expect(ctx.createdSources[0].stopped).toBe(true);
    expect(ctx.close).toHaveBeenCalled();
  });

  it('creates a new context after dispose', async () => {
    const engine = await freshEngine();
    engine.playDefaultTick('inhale');
    await engine.dispose();
    engine.playDefaultTick('inhale');
    expect(StubAudioContext.instances).toHaveLength(2);
  });

  it('decode resolves for valid data and rejects for invalid', async () => {
    const engine = await freshEngine();
    await expect(engine.decode(new ArrayBuffer(8))).resolves.toEqual({ duration: 1 });
    await expect(engine.decode(new ArrayBuffer(0))).rejects.toThrow();
  });

  it('decode passes a copy so the original buffer is not detached', async () => {
    const engine = await freshEngine();
    const original = new ArrayBuffer(8);
    await engine.decode(original);
    const ctx = StubAudioContext.instances[0];
    expect(ctx.decodeAudioData.mock.calls[0][0]).not.toBe(original);
    expect(original.byteLength).toBe(8);
  });

  it('resumes a suspended context before playing', async () => {
    const engine = await freshEngine();
    engine.playDefaultTick('inhale');
    const ctx = StubAudioContext.instances[0];
    ctx.state = 'suspended';
    engine.playDefaultTick('inhale');
    expect(ctx.resume).toHaveBeenCalled();
  });
});
