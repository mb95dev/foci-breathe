import type { Prompt } from './types.ts';

export interface PromptSelector {
  next(library: readonly Prompt[]): Prompt;
  reset(): void;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createPromptSelector(): PromptSelector {
  let deck: Prompt[] = [];
  let lastId: string | undefined;

  function refillDeck(library: readonly Prompt[]): void {
    if (library.length === 0) {
      deck = [];
      return;
    }

    if (library.length === 1) {
      deck = [...library];
      return;
    }

    let nextDeck = shuffle(library);
    if (lastId !== undefined && nextDeck[0]?.id === lastId) {
      const swapIndex = 1 + Math.floor(Math.random() * (nextDeck.length - 1));
      [nextDeck[0], nextDeck[swapIndex]] = [nextDeck[swapIndex], nextDeck[0]];
    }
    deck = nextDeck;
  }

  return {
    next(library: readonly Prompt[]): Prompt {
      if (library.length === 0) {
        throw new Error('Prompt library is empty');
      }

      if (deck.length === 0) {
        refillDeck(library);
      }

      const prompt = deck.shift()!;
      lastId = prompt.id;
      return prompt;
    },

    reset() {
      deck = [];
      lastId = undefined;
    },
  };
}
