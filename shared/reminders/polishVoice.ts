export const POLISH_LANG = 'pl-PL';

const POLISH_NAME = /polish|polski|paulina|marek|zosia|agnieszka|filip/i;

export function normalizeVoiceLang(lang: string): string {
  return lang.trim().toLowerCase().replaceAll('_', '-');
}

export function isPolishVoice(voice: Pick<SpeechSynthesisVoice, 'lang' | 'name'>): boolean {
  const lang = normalizeVoiceLang(voice.lang);
  return lang === 'pl' || lang.startsWith('pl-') || POLISH_NAME.test(voice.name);
}

export function findPolishVoice(
  voices: readonly Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>[],
): (typeof voices)[number] | undefined {
  const polish = voices.filter(isPolishVoice);
  return (
    polish.find(voice => normalizeVoiceLang(voice.lang).startsWith('pl') && voice.localService)
    ?? polish.find(voice => normalizeVoiceLang(voice.lang).startsWith('pl'))
    ?? polish[0]
  );
}

export function configurePolishUtterance(
  utterance: SpeechSynthesisUtterance,
  voices: readonly SpeechSynthesisVoice[] = window.speechSynthesis.getVoices(),
): void {
  utterance.lang = POLISH_LANG;
  const voice = findPolishVoice(voices);
  if (voice) {
    utterance.voice = voice as SpeechSynthesisVoice;
    utterance.lang = voice.lang || POLISH_LANG;
  }
}

export async function waitForVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) {
    return immediate;
  }

  return new Promise(resolve => {
    const finish = (voices: SpeechSynthesisVoice[]) => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged);
      window.clearTimeout(timer);
      window.clearInterval(poll);
      resolve(voices);
    };

    const onChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        finish(voices);
      }
    };

    const poll = window.setInterval(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        finish(voices);
      }
    }, 50);

    const timer = window.setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
    window.speechSynthesis.addEventListener('voiceschanged', onChanged);
    window.speechSynthesis.getVoices();
  });
}
