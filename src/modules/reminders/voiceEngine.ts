import {
  configurePolishUtterance,
  waitForVoices,
} from '../../../shared/reminders/polishVoice.ts';

export interface VoiceEngine {
  speak(text: string, volume: number): Promise<void>;
  isAvailable(): boolean;
}

export function createVoiceEngine(): VoiceEngine {
  return {
    isAvailable() {
      return typeof window !== 'undefined' && 'speechSynthesis' in window;
    },

    async speak(text: string, volume: number) {
      if (!this.isAvailable()) {
        throw new Error('TTS_UNAVAILABLE');
      }

      const voices = await waitForVoices();

      return new Promise((resolve, reject) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        configurePolishUtterance(utterance, voices);
        utterance.volume = Math.min(1, Math.max(0, volume));
        utterance.onend = () => resolve();
        utterance.onerror = event => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            resolve();
            return;
          }
          reject(new Error('TTS_UNAVAILABLE'));
        };
        window.speechSynthesis.speak(utterance);
      });
    },
  };
}
