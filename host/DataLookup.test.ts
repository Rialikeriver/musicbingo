// Tests for DataLookup. Run them with the steps in DataLookup.md.
import * as assert from 'assert';
import { DataLookup } from './DataLookup';
import { Track } from './index';

function makeTrack(id: string, filePath: string): Track {
  return {
    id,
    title: `Title ${id}`,
    artist: 'Artist',
    album: 'Album',
    filePath,
    startTime: 0,
    endTime: 200,
    duration: 200,
  };
}

const lookup = new DataLookup();
const track = makeTrack('t1', 'C:/music/one.mp3');

// Starts empty
assert.strictEqual(lookup.size(), 0);
assert.strictEqual(lookup.has('t1'), false);

// add + lookups
lookup.add(track);
assert.strictEqual(lookup.size(), 1);
assert.strictEqual(lookup.has('t1'), true);
assert.strictEqual(lookup.getAddress('t1'), 'C:/music/one.mp3');
assert.deepStrictEqual(lookup.getTrack('t1'), track);

// Unknown id returns undefined, does not throw
assert.strictEqual(lookup.getAddress('missing'), undefined);
assert.strictEqual(lookup.getTrack('missing'), undefined);
assert.strictEqual(lookup.has('missing'), false);

// Duplicate id is rejected and does not overwrite
assert.throws(() => lookup.add(makeTrack('t1', 'other.mp3')), /already exists/);
assert.strictEqual(lookup.getAddress('t1'), 'C:/music/one.mp3');

// remove
assert.strictEqual(lookup.remove('t1'), true);
assert.strictEqual(lookup.remove('t1'), false);
assert.strictEqual(lookup.size(), 0);

// all() returns every stored track
lookup.add(makeTrack('a', 'a.mp3'));
lookup.add(makeTrack('b', 'b.mp3'));
assert.deepStrictEqual(lookup.all().map(t => t.id), ['a', 'b']);
lookup.remove('a');
lookup.remove('b');

// update() replaces a stored track and keeps its place; unknown ids return false
lookup.add(makeTrack('x', 'x.mp3'));
lookup.add(makeTrack('y', 'y.mp3'));
assert.strictEqual(lookup.update({ ...makeTrack('x', 'x.mp3'), title: 'New' }), true);
assert.strictEqual(lookup.getTrack('x')!.title, 'New');
assert.deepStrictEqual(lookup.all().map(t => t.id), ['x', 'y']);
assert.strictEqual(lookup.update(makeTrack('nope', 'n.mp3')), false);
lookup.remove('x');
lookup.remove('y');

console.log('DataLookup: all tests passed');
