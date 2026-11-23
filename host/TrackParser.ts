// Reads artist and title from a file name such as "Queen - Bohemian Rhapsody.mp3".
// Pure functions only (no Electron, no file access), so they are easy to test.

export const UNKNOWN_ARTIST = 'Unknown Artist';

export interface ParsedName {
  artist: string;
  title: string;
}

// Takes a file name or full path and returns the artist and title.
// Rules:
//   - Folders are ignored, only the file name is used ("C:/a/b/Queen - X.mp3" -> "Queen - X.mp3").
//   - The extension is removed (".mp3", ".mp4", ".wav", ...).
//   - The name is split at the FIRST " - " (space, dash, space).
//     "Artist - Title - Remix" -> artist "Artist", title "Title - Remix".
//   - Quotes, brackets and other punctuation are kept exactly as written.
//   - If there is no " - ", the artist is UNKNOWN_ARTIST and the whole name is the title.
export function parseTrackName(fileNameOrPath: string): ParsedName {
  const fileName = fileNameOrPath.split(/[\\/]/).pop() ?? '';
  const base = fileName.replace(/\.[^/.]+$/, '').trim();

  const separator = base.indexOf(' - ');
  if (separator === -1) {
    return { artist: UNKNOWN_ARTIST, title: base };
  }

  const artist = base.slice(0, separator).trim();
  const title = base.slice(separator + 3).trim();

  // " - " at the very start or end, e.g. " - Song" or "Artist - ", is not a real split.
  if (artist === '' || title === '') {
    return { artist: UNKNOWN_ARTIST, title: base };
  }

  return { artist, title };
}
