// Tests for CardRegister and the free-space toggle in BingoEngine.
// Run them the same way as the other host tests (see DataLookup.md).
import * as assert from 'assert';
import { BingoEngine } from './BingoEngine';
import { CardRegister, DEFAULT_CARD_COUNT, normalizeCardId } from './CardRegister';

// 30 songs: enough for the 24 song squares on a 5x5 card
const pool = Array.from({ length: 30 }, (_, i) => ({
  id: `s${i + 1}`,
  title: `Title ${i + 1}`,
  artist: `Artist ${i + 1}`,
}));

// ---- BingoEngine.generateCard: free space toggle ----

// The old call (five arguments) still puts a free square in the middle
const oldStyle = BingoEngine.generateCard('397', pool, 5, 'song', false);
assert.strictEqual(oldStyle.cardId, '397');
assert.strictEqual(oldStyle.grid[2][2].isFreeSpace, true);
assert.strictEqual(oldStyle.markedGrid[2][2], true);
assert.strictEqual(BingoEngine.cardHasFreeSpace(oldStyle), true);

// Free space off: the middle is a normal song square and is not marked
const noFree = BingoEngine.generateCard('1', pool, 5, 'song', false, false);
assert.strictEqual(noFree.grid[2][2].isFreeSpace, false);
assert.strictEqual(noFree.grid[2][2].id !== 'FREE_SPACE', true);
assert.strictEqual(noFree.markedGrid[2][2], false);
assert.strictEqual(noFree.markedGrid.flat().every(v => v === false), true);
assert.strictEqual(BingoEngine.cardHasFreeSpace(noFree), false);

// Even sizes never have a free square
const even = BingoEngine.generateCard('1', pool, 4);
assert.strictEqual(BingoEngine.cardHasFreeSpace(even), false);

// ---- BingoEngine validation with free space off ----

// Middle row marked except the centre square
const middleRowNoCentre = Array.from({ length: 5 }, (_, r) =>
  Array.from({ length: 5 }, (_, c) => r === 2 && c !== 2)
);
// With the free space (default) the centre counts, so this is a horizontal win
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowNoCentre, 'horizontal').isWin, true);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowNoCentre, 'standard_line').isWin, true);
// With the free space off, the player must mark the centre too
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowNoCentre, 'horizontal', undefined, false).isWin, false);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowNoCentre, 'standard_line', undefined, false).isWin, false);
// Marking the centre makes it a win again
const middleRowFull = middleRowNoCentre.map(row => [...row]);
middleRowFull[2][2] = true;
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowFull, 'horizontal', undefined, false).isWin, true);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(middleRowFull, 'standard_line', undefined, false).isWin, true);

// Shape patterns: blackout missing only the centre
const allButCentre = Array.from({ length: 5 }, (_, r) =>
  Array.from({ length: 5 }, (_, c) => !(r === 2 && c === 2))
);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(allButCentre, 'blackout').isWin, true);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(allButCentre, 'blackout', undefined, false).isWin, false);
const blackoutMask = BingoEngine.generatePatternMask('blackout', 5);
assert.strictEqual(BingoEngine.validateBingo(allButCentre, blackoutMask), true);
assert.strictEqual(BingoEngine.validateBingo(allButCentre, blackoutMask, false), false);

// Patterns that skip the centre are not affected by the toggle
const corners = BingoEngine.generatePatternMask('corners', 5);
const cornersMarked = Array.from({ length: 5 }, (_, r) =>
  Array.from({ length: 5 }, (_, c) => (r === 0 || r === 4) && (c === 0 || c === 4))
);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(cornersMarked, 'corners').isWin, true);
assert.strictEqual(BingoEngine.validateCardAgainstRoundPattern(cornersMarked, 'corners', undefined, false).isWin, true);
assert.strictEqual(BingoEngine.validateBingo(cornersMarked, corners, false), true);

// ---- normalizeCardId ----
assert.strictEqual(normalizeCardId(397), '397');
assert.strictEqual(normalizeCardId('397'), '397');
assert.strictEqual(normalizeCardId(' #397 '), '397');
assert.strictEqual(normalizeCardId('0397'), '397');
assert.strictEqual(normalizeCardId('0'), '0');
assert.strictEqual(normalizeCardId('abc'), 'abc');

// ---- CardRegister ----
assert.strictEqual(DEFAULT_CARD_COUNT, 250);

const register = new CardRegister();
assert.strictEqual(register.size(), 0);
assert.strictEqual(register.lookup(1), undefined);

// Default round: 250 cards numbered 1 to 250
const made = register.generate(pool);
assert.strictEqual(made.length, 250);
assert.strictEqual(register.size(), 250);
assert.deepStrictEqual(made.map(c => c.cardId).slice(0, 3), ['1', '2', '3']);
assert.strictEqual(made[249].cardId, '250');
assert.strictEqual(new Set(made.map(c => c.cardId)).size, 250);

// Lookup by number, in the different ways someone might type it
assert.strictEqual(register.lookup(1)?.cardId, '1');
assert.strictEqual(register.lookup(250)?.cardId, '250');
assert.strictEqual(register.lookup('250')?.cardId, '250');
assert.strictEqual(register.lookup('#7')?.cardId, '7');
assert.strictEqual(register.lookup(' 007 ')?.cardId, '7');
assert.strictEqual(register.has(100), true);
assert.strictEqual(register.lookup(251), undefined);
assert.strictEqual(register.lookup(0), undefined);
assert.strictEqual(register.lookup(-1), undefined);
assert.strictEqual(register.lookup(1.5), undefined);
assert.strictEqual(register.lookup(''), undefined);
assert.strictEqual(register.lookup('abc'), undefined);
assert.strictEqual(register.has(251), false);

// The registered card is the same object the generator returned
assert.strictEqual(register.lookup(42), made[41]);

// Every default card is 5x5 with a free middle square and 24 song squares
for (const card of made) {
  assert.strictEqual(card.grid.length, 5);
  assert.strictEqual(card.grid[2][2].isFreeSpace, true);
  assert.strictEqual(card.grid.flat().filter(s => !s.isFreeSpace).length, 24);
}

// Options: count, size, free space off
const small = new CardRegister();
const noFreeCards = small.generate(pool, { count: 5, freeSpace: false });
assert.strictEqual(noFreeCards.length, 5);
assert.strictEqual(small.size(), 5);
assert.strictEqual(noFreeCards.every(c => !BingoEngine.cardHasFreeSpace(c)), true);
assert.strictEqual(noFreeCards.every(c => c.grid.flat().every(s => !s.isFreeSpace)), true);

const threeByThree = new CardRegister().generate(pool, { count: 2, size: 3 });
assert.strictEqual(threeByThree[0].grid.length, 3);
assert.strictEqual(BingoEngine.cardHasFreeSpace(threeByThree[0]), true);

// Display option is passed through to the squares
const artistCards = new CardRegister().generate(pool, { count: 1, displayOption: 'artist' });
const firstSong = artistCards[0].grid.flat().find(s => !s.isFreeSpace)!;
assert.strictEqual(firstSong.displayValue, firstSong.artist);

// Making a new set replaces the old one, numbering starts again at 1
register.generate(pool, { count: 3 });
assert.strictEqual(register.size(), 3);
assert.strictEqual(register.lookup(4), undefined);
assert.strictEqual(register.lookup(3)?.cardId, '3');

// Bad settings are rejected and leave the register as it was
assert.throws(() => register.generate(pool, { count: 0 }), RangeError);
assert.throws(() => register.generate(pool, { count: -5 }), RangeError);
assert.throws(() => register.generate(pool, { count: 2.5 }), RangeError);
assert.throws(() => register.generate(pool, { count: NaN }), RangeError);
assert.throws(() => register.generate([], { count: 3 }), /empty song list/);
assert.strictEqual(register.size(), 3);

// add() and clear()
const extra = BingoEngine.generateCard('99', pool);
register.add(extra);
assert.strictEqual(register.lookup('99'), extra);
assert.throws(() => register.add(BingoEngine.generateCard('99', pool)), /already registered/);
assert.throws(() => register.add(BingoEngine.generateCard('#99', pool)), /already registered/);
assert.strictEqual(register.all().length, 4);
register.clear();
assert.strictEqual(register.size(), 0);
assert.deepStrictEqual(register.all(), []);

console.log('CardRegister: all tests passed');
