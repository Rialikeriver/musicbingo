// Tests for TrackParser. Run them with the steps in CHANGES.md.
import * as assert from 'assert';
import { parseTrackName, UNKNOWN_ARTIST } from './TrackParser';

// Normal "Artist - Title" name
assert.deepStrictEqual(parseTrackName('Queen - Bohemian Rhapsody.mp3'),
  { artist: 'Queen', title: 'Bohemian Rhapsody' });

// Full path: only the file name is used
assert.deepStrictEqual(parseTrackName('C:\\Music\\Queen - Bohemian Rhapsody.mp3'),
  { artist: 'Queen', title: 'Bohemian Rhapsody' });
assert.deepStrictEqual(parseTrackName('/home/me/Queen - Bohemian Rhapsody.mp3'),
  { artist: 'Queen', title: 'Bohemian Rhapsody' });

// Only the first " - " splits the name
assert.deepStrictEqual(parseTrackName('Artist - Title - Remix.mp4'),
  { artist: 'Artist', title: 'Title - Remix' });

// Quotes and brackets are kept exactly
assert.deepStrictEqual(parseTrackName('Prince - "Purple Rain" (Live) [HD].mp3'),
  { artist: 'Prince', title: '"Purple Rain" (Live) [HD]' });

// No separator: unknown artist, whole name is the title
assert.deepStrictEqual(parseTrackName('JustASong.wav'),
  { artist: UNKNOWN_ARTIST, title: 'JustASong' });

// Separator with nothing on one side: not a real split
assert.deepStrictEqual(parseTrackName(' - Song.mp3'),
  { artist: UNKNOWN_ARTIST, title: '- Song' });
assert.deepStrictEqual(parseTrackName('Artist - .mp3'),
  { artist: UNKNOWN_ARTIST, title: 'Artist -' });

// Extra spaces are trimmed
assert.deepStrictEqual(parseTrackName('  Queen   -   Bohemian Rhapsody  .mp3'),
  { artist: 'Queen', title: 'Bohemian Rhapsody' });

// Only the last extension is removed
assert.deepStrictEqual(parseTrackName('Dr. Dre - Still D.R.E..mp3'),
  { artist: 'Dr. Dre', title: 'Still D.R.E.' });

console.log('TrackParser: all tests passed');
