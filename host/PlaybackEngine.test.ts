// Tests for PlaybackEngine.loadTrack. The address lookup is the catalog's getAddress.
import * as assert from 'assert';
import { PlaybackEngine } from './PlaybackEngine';
import { mediaUrlFor, filePathFromMediaUrl } from './mediaUrl';

const catalog: Record<string, string> = {
  'track-1': 'C:\\Music\\Queen - Bohemian Rhapsody.mp3',
};
const engine = new PlaybackEngine((id) => catalog[id]);

// A known song points the element at its media:// address
const element = { src: '' };
assert.strictEqual(engine.loadTrack('track-1', element), true);
assert.strictEqual(element.src, mediaUrlFor('C:\\Music\\Queen - Bohemian Rhapsody.mp3'));
assert.strictEqual(filePathFromMediaUrl(element.src), 'C:\\Music\\Queen - Bohemian Rhapsody.mp3');
assert.strictEqual(engine.getCurrentTrackId(), 'track-1');

// An unknown song leaves the element alone and reports false
const other = { src: 'unchanged' };
assert.strictEqual(engine.loadTrack('missing', other), false);
assert.strictEqual(other.src, 'unchanged');
assert.strictEqual(engine.getCurrentTrackId(), 'track-1', 'current track is not changed by a failed load');

// An engine without a catalog never finds anything
const bare = new PlaybackEngine();
assert.strictEqual(bare.loadTrack('track-1', { src: '' }), false);

console.log('PlaybackEngine: all tests passed');
