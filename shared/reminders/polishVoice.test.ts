import { describe, expect, it } from 'vitest';
import { configurePolishUtterance, findPolishVoice, isPolishVoice, POLISH_LANG } from './polishVoice.ts';

function voice(partial: { lang: string; name: string; localService?: boolean }) {
  return { localService: false, ...partial };
}

describe('polishVoice', () => {
  it('treats pl, pl-PL, and pl_PL as Polish', () => {
    expect(isPolishVoice(voice({ lang: 'pl', name: 'X' }))).toBe(true);
    expect(isPolishVoice(voice({ lang: 'pl-PL', name: 'X' }))).toBe(true);
    expect(isPolishVoice(voice({ lang: 'pl_PL', name: 'X' }))).toBe(true);
  });

  it('treats known Polish voice names as Polish even with a generic lang', () => {
    expect(isPolishVoice(voice({ lang: 'en-US', name: 'Microsoft Paulina' }))).toBe(true);
    expect(isPolishVoice(voice({ lang: 'en-US', name: 'Zosia' }))).toBe(true);
  });

  it('rejects English voices', () => {
    expect(isPolishVoice(voice({ lang: 'en-US', name: 'Google US English' }))).toBe(false);
  });

  it('prefers a local pl-PL voice over a remote one', () => {
    const selected = findPolishVoice([
      voice({ lang: 'pl-PL', name: 'Cloud Polish', localService: false }),
      voice({ lang: 'pl-PL', name: 'Microsoft Paulina', localService: true }),
    ]);
    expect(selected?.name).toBe('Microsoft Paulina');
  });

  it('forces pl-PL on the utterance and assigns the Polish voice', () => {
    const utterance = { lang: '', voice: null as SpeechSynthesisVoice | null };
    const polish = {
      lang: 'pl-PL',
      name: 'Polish',
      localService: true,
    } as SpeechSynthesisVoice;

    configurePolishUtterance(utterance as SpeechSynthesisUtterance, [polish]);

    expect(utterance.lang).toBe(POLISH_LANG);
    expect(utterance.voice).toBe(polish);
  });

  it('still sets pl-PL when no Polish voice is installed', () => {
    const utterance = { lang: '', voice: null as SpeechSynthesisVoice | null };
    configurePolishUtterance(utterance as SpeechSynthesisUtterance, [
      { lang: 'en-US', name: 'Google US English', localService: true } as SpeechSynthesisVoice,
    ]);
    expect(utterance.lang).toBe(POLISH_LANG);
    expect(utterance.voice).toBeNull();
  });
});
