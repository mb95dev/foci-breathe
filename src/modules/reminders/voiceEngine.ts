export interface VoiceEngine {
  speak(text: string, volume: number): Promise<void>;
  isAvailable(): boolean;
}

export function createVoiceEngine(): VoiceEngine {
  return {
    isAvailable() {
      return typeof window !== 'undefined' && 'speechSynthesis' in window;
    },

    speak(text: string, volume: number) {
      return new Promise((resolve, reject) => {
        if (!this.isAvailable()) {
          reject(new Error('TTS_UNAVAILABLE'));
          return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
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
