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

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume;
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error('TTS_UNAVAILABLE'));
        window.speechSynthesis.speak(utterance);
      });
    },
  };
}
