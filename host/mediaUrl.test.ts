// Tests for mediaUrl. Run them with the steps in the test notes (see commit message).
import * as assert from 'assert';
import { filePathFromMediaUrl, mediaUrlFor, MEDIA_SCHEME } from './mediaUrl';

// Windows path with spaces, dashes and quotes survives a round trip
const windowsPath = 'C:\\Music\\Queen - "Bohemian Rhapsody" (Live) [HD].mp3';
const url = mediaUrlFor(windowsPath);
assert.ok(url.startsWith(`${MEDIA_SCHEME}://local/`));
assert.strictEqual(filePathFromMediaUrl(url), windowsPath);

// Plain path round trip
assert.strictEqual(filePathFromMediaUrl(mediaUrlFor('/home/me/song.mp4')), '/home/me/song.mp4');

// Characters that would break a normal URL are encoded
assert.ok(!mediaUrlFor('C:/a b/c#d?e.mp3').includes(' '));
assert.strictEqual(filePathFromMediaUrl(mediaUrlFor('C:/a b/c#d?e.mp3')), 'C:/a b/c#d?e.mp3');

console.log('mediaUrl: all tests passed');
