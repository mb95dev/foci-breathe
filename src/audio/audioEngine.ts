import type { BreathPhase } from '../types/breathing';

const TICK_PARAMS: Record<BreathPhase, { pitch: number; volume: number }> = {
  inhale: { pitch: 1200, volume: 0.35 },  // high crisp tick — breathe in
  exhale: { pitch: 800,  volume: 0.30 },  // standard tick — breathe out
  hold:   { pitch: 600,  volume: 0.18 },  // soft low tick — hold
  rest:   { pitch: 600,  volume: 0.18 },
};

/**
 * Singleton owner of the one AudioContext and every source node lifecycle.
 * All session and preview audio flows through this engine so `stopAll()`
 * silences both currently playing and future-scheduled sounds, and
 * `dispose()` releases the context entirely.
 */
class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private liveNodes = new Set<AudioScheduledSourceNode>();

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.liveNodes.clear();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private track(node: AudioScheduledSourceNode): void {
    this.liveNodes.add(node);
    node.onended = () => {
      this.liveNodes.delete(node);
      node.disconnect();
    };
  }

  /**
   * Synthesized metronome tick: a short noise burst (click transient)
   * layered with a pitched tone (body), both decaying rapidly.
   */
  playDefaultTick(phase: BreathPhase): void {
    const { pitch, volume } = TICK_PARAMS[phase];
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Noise burst — the sharp "click" transient
    const bufLen = Math.floor(ctx.sampleRate * 0.015); // 15ms
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen); // decaying noise
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    // Bandpass filter to shape the noise into a woody click
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = pitch * 3;
    filter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 1.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Pitched tone — the resonant "body" of the tick
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, now + 0.04);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    this.track(noiseSrc);
    this.track(osc);

    noiseSrc.start(now);
    noiseSrc.stop(now + 0.025);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Plays a decoded buffer once (custom ticker sound / preview). */
  playBuffer(buffer: AudioBuffer): void {
    const ctx = this.getContext();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    this.track(src);
    src.start();
  }

  /**
   * Decodes audio bytes; used both as the upload decodability gate and on
   * restore. Decodes a copy because decodeAudioData detaches its input
   * buffer, and callers need the original bytes for persistence.
   */
  decode(data: ArrayBuffer): Promise<AudioBuffer> {
    return this.getContext().decodeAudioData(data.slice(0));
  }

  /**
   * Stops every tracked source node — playing and future-scheduled alike —
   * and clears the registry.
   */
  stopAll(): void {
    for (const node of this.liveNodes) {
      try {
        node.onended = null;
        node.stop();
      } catch {
        // InvalidStateError for already-ended/never-started nodes — ignore
      }
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    }
    this.liveNodes.clear();
  }

  /** stopAll + close the AudioContext, releasing audio resources. */
  async dispose(): Promise<void> {
    this.stopAll();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        await this.ctx.close();
      } catch {
        // already closing — ignore
      }
    }
    this.ctx = null;
  }
}

export type AudioEngine = AudioEngineImpl;

export const audioEngine = new AudioEngineImpl();
