import fs from 'fs';
import path from 'path';
import { Track } from './index';
import { DataLookup } from './DataLookup';
import { parseTrackName } from './TrackParser';
import { stableTrackId } from './stableId';

// The song catalog, saved to one JSON file and loaded again on start-up.
export class CatalogStore {
  private lookup = new DataLookup();

  constructor(private readonly filePath: string) {}

  // Load the catalog from disk.
  // - No file yet: start with an empty catalog.
  // - Damaged file: rename it to "<file>.bak" so nothing is lost, then start empty.
  load(): void {
    this.lookup = new DataLookup();
    if (!fs.existsSync(this.filePath)) return;

    try {
      const tracks = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as Track[];
      for (const track of tracks) {
        if (!this.lookup.has(track.id)) this.lookup.add(track);
      }
    } catch {
      fs.renameSync(this.filePath, `${this.filePath}.bak`);
      this.lookup = new DataLookup();
    }
  }

  // Write the whole catalog to disk. Writes a temporary file first, then replaces the real one,
  // so a crash mid-save cannot leave a half-written catalog.
  save(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.lookup.all(), null, 2), 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  // Add one audio/video file to the catalog.
  // duration is in seconds, measured by the screen that picked the file.
  // Returns the new track, or null if this file is already in the catalog.
  importFile(filePath: string, duration: number): Track | null {
    const id = stableTrackId(filePath);
    if (this.lookup.has(id)) return null;

    const { artist, title } = parseTrackName(filePath);
    const length = duration > 0 ? duration : 30; // same fallback the import screen uses

    const track: Track = {
      id,
      title,
      artist,
      album: 'Unknown Album',
      filePath,
      startTime: 0,
      endTime: length,
      duration: length,
    };

    this.lookup.add(track);
    this.save();
    return track;
  }

  list(): Track[] {
    return this.lookup.all();
  }

  // Remove a track by id. Returns true if it was removed.
  remove(id: string): boolean {
    const removed = this.lookup.remove(id);
    if (removed) this.save();
    return removed;
  }

  // Save a new crop (start and end, in seconds) for a track.
  // Returns the updated track, or null if the id is unknown or the crop is invalid
  // (start must be >= 0 and end must be after start).
  updateCrop(id: string, startTime: number, endTime: number): Track | null {
    const existing = this.lookup.getTrack(id);
    if (!existing) return null;
    if (!(startTime >= 0) || !(endTime > startTime)) return null;

    const updated: Track = { ...existing, startTime, endTime };
    this.lookup.update(updated);
    this.save();
    return updated;
  }
}
