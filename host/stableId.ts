// Gives each file the same id every time it is imported.
// The id is made from the file path, so importing the same file twice gives the same id,
// and the catalog can spot duplicates. Unlike Date.now() + Math.random(), the id does not change between runs.
import { createHash } from 'crypto';

export function stableTrackId(filePath: string): string {
  // Use forward slashes and lower case so "C:\Music\A.mp3" and "c:/music/a.mp3" match on Windows.
  const normalized = filePath.trim().replace(/\\/g, '/').toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}
