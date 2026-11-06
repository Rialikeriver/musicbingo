// Tests for stableTrackId. Run them with the steps in CHANGES.md.
import * as assert from 'assert';
import { stableTrackId } from './stableId';

// Same path always gives the same id
assert.strictEqual(stableTrackId('C:/music/a.mp3'), stableTrackId('C:/music/a.mp3'));

// Slashes and letter case do not change the id (Windows paths)
assert.strictEqual(stableTrackId('C:\\Music\\A.mp3'), stableTrackId('c:/music/a.mp3'));

// Different files give different ids
assert.notStrictEqual(stableTrackId('C:/music/a.mp3'), stableTrackId('C:/music/b.mp3'));

// Id has a fixed length of 16 hex characters
assert.match(stableTrackId('C:/music/a.mp3'), /^[0-9a-f]{16}$/);

console.log('stableId: all tests passed');
