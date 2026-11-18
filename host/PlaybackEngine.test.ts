// Tests for PlaybackEngine.loadTrack. The address lookup is the catalog's getAddress.
import * as assert from 'assert';
import { PlaybackEngine, MediaElement } from './PlaybackEngine';
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

// Speed, volume and durations: applied to a loaded element and kept for later songs
const speedEngine = new PlaybackEngine((id) => catalog[id]);
const media: MediaElement = { src: '' };
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.0);
assert.strictEqual(speedEngine.loadTrack('track-1', media), true);
assert.strictEqual(media.playbackRate, 1.0, 'a new song starts at the chosen speed');

speedEngine.setSpeed(1.5);
assert.strictEqual(media.playbackRate, 1.5, 'changing speed updates the loaded song');
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.5);

speedEngine.setSpeed(10);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 2.0, 'speed is capped at 2x');
speedEngine.setSpeed(0.01);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 0.5, 'speed has a floor of 0.5x');
speedEngine.setSpeed(NaN);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.0, 'a bad speed falls back to normal');

speedEngine.setSpeed(0.75);
const next: MediaElement = { src: '' };
speedEngine.loadTrack('track-1', next);
assert.strictEqual(next.playbackRate, 0.75, 'the next song keeps the chosen speed');

speedEngine.setVolume(0.4);
assert.strictEqual(next.volume, 0.4, 'volume applies to the loaded song');
speedEngine.setVolume(5);
assert.strictEqual(speedEngine.getVolume(), 1.0, 'volume is capped at full');

speedEngine.setCallDuration(45.6);
assert.strictEqual(speedEngine.getCallDuration(), 46, 'call length is whole seconds');
speedEngine.setBreakDuration(-3);
assert.strictEqual(speedEngine.getBreakDuration(), 0, 'break length is never negative');
speedEngine.setBreakDuration(8);
assert.strictEqual(speedEngine.getBreakDuration(), 8);

console.log('PlaybackEngine: all tests passed');
