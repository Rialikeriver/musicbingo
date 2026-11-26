// CardRegister: makes a round's bingo cards and finds a card again by its number.
// Card numbers are plain numbers starting at 1 ("1", "2", ... "250").
import { BingoEngine } from './BingoEngine';
import type { BingoCard, DisplayOption } from './BingoEngine';

// How many cards one round makes unless the host asks for a different number
export const DEFAULT_CARD_COUNT = 250;

// A song the cards can be made from
export interface CardSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
}

// Settings for making a set of cards. Anything left out uses the default.
export interface CardSetOptions {
  count?: number;                 // how many cards (default 250)
  size?: number;                  // squares per side (default 5)
  displayOption?: DisplayOption;  // song, artist or album text on the squares
  scrambleOnPlayerSide?: boolean; // scramble the text for hint mode
  freeSpace?: boolean;            // middle free square on or off (default on)
}

// Turns what a person types ("397", " #397 ", "0397") into the stored card number
export function normalizeCardId(input: string | number): string {
  const text = String(input).trim().replace(/^#/, '').trim();
  return /^\d+$/.test(text) ? String(parseInt(text, 10)) : text;
}

export class CardRegister {
  // Map keeps the cards in the order they were made
  private cards = new Map<string, BingoCard>();

  // Makes a new set of cards and replaces whatever was registered before
  // (a new round starts with a fresh set). Returns the cards, numbered 1 to count.
  generate(songPool: CardSong[], options: CardSetOptions = {}): BingoCard[] {
    const {
      count = DEFAULT_CARD_COUNT,
      size = 5,
      displayOption = 'song',
      scrambleOnPlayerSide = false,
      freeSpace = true,
    } = options;

    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(`Card count must be a whole number of at least 1, got ${count}`);
    }
    if (!Number.isInteger(size) || size < 3) {
      throw new RangeError(`Card size must be a whole number of at least 3, got ${size}`);
    }
    if (songPool.length === 0) {
      throw new Error('Cannot make cards from an empty song list');
    }

    // Use each song once. A card with the same song twice would mark two squares at once.
    const songs = [...new Map(songPool.map(song => [song.id, song])).values()];
    const hasFreeSquare = freeSpace && size % 2 !== 0;
    const songSquares = size * size - (hasFreeSquare ? 1 : 0);
    if (songs.length < songSquares) {
      throw new Error(
        `A ${size}x${size} card needs at least ${songSquares} different songs, but only ${songs.length} were given`
      );
    }

    this.cards.clear();
    for (let n = 1; n <= count; n++) {
      this.add(
        BingoEngine.generateCard(String(n), songs, size, displayOption, scrambleOnPlayerSide, freeSpace)
      );
    }
    return this.all();
  }

  // Registers a card that was made elsewhere. Throws if its number is already taken.
  add(card: BingoCard): void {
    const id = normalizeCardId(card.cardId);
    if (this.cards.has(id)) {
      throw new Error(`Card number already registered: ${id}`);
    }
    this.cards.set(id, card);
  }

  // Finds a card by its number. Accepts 397, "397", "#397" or "0397".
  lookup(cardNumber: string | number): BingoCard | undefined {
    return this.cards.get(normalizeCardId(cardNumber));
  }

  has(cardNumber: string | number): boolean {
    return this.cards.has(normalizeCardId(cardNumber));
  }

  // Every card, in the order they were registered
  all(): BingoCard[] {
    return [...this.cards.values()];
  }

  size(): number {
    return this.cards.size;
  }

  // Forgets every card
  clear(): void {
    this.cards.clear();
  }
}
