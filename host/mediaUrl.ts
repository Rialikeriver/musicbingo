// Turns a song's file path into a media:// address the screens can play, and back again.
// This file has no Electron imports, so the screens and the tests can both use it.

export const MEDIA_SCHEME = 'media';

// "C:\Music\Queen - Bohemian Rhapsody.mp3" -> "media://local/C%3A%5CMusic%5CQueen%20-%20Bohemian%20Rhapsody.mp3"
export function mediaUrlFor(filePath: string): string {
  return `${MEDIA_SCHEME}://local/${encodeURIComponent(filePath)}`;
}

// The reverse: the address the screen asked for -> the original file path.
export function filePathFromMediaUrl(url: string): string {
  const parsed = new URL(url);
  return decodeURIComponent(parsed.pathname.slice(1));
}
