import { parseFile } from 'music-metadata';

// What the file's own tags say about it. Any field can be missing.
export interface FileTags {
  artist?: string;
  title?: string;
  duration?: number; // seconds
}

// Read the artist, title and length from an MP3/MP4 file's tags.
// If the file has no readable tags, or cannot be read, this returns an empty object
// and the caller falls back to the file name.
export async function readFileTags(filePath: string): Promise<FileTags> {
  try {
    const metadata = await parseFile(filePath, { duration: true });
    const artist = metadata.common.artist?.trim() || undefined;
    const title = metadata.common.title?.trim() || undefined;
    const seconds = metadata.format.duration;
    return {
      artist,
      title,
      duration: seconds && seconds > 0 ? Math.round(seconds) : undefined,
    };
  } catch {
    return {};
  }
}
