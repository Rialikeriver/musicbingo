import { Track } from './index';

// Stores tracks by their id and looks up their file address.
// TypeScript has no pointers, so other code asks for a track by its id.
export class DataLookup {
  private tracks: Map<string, Track> = new Map();

  // Store a track. Throws if the id is already used.
  public add(track: Track): void {
    if (this.tracks.has(track.id)) {
      throw new Error(`Track with id "${track.id}" already exists`);
    }
    this.tracks.set(track.id, track);
  }

  // True if a track with this id is stored.
  public has(id: string): boolean {
    return this.tracks.has(id);
  }

  // Returns the full track, or undefined if the id is not found.
  public getTrack(id: string): Track | undefined {
    return this.tracks.get(id);
  }

  // Returns the file address (filePath) for a track id, or undefined if not found.
  public getAddress(id: string): string | undefined {
    return this.tracks.get(id)?.filePath;
  }

  // Removes a track. Returns true if it was removed.
  public remove(id: string): boolean {
    return this.tracks.delete(id);
  }

  // Number of stored tracks.
  public size(): number {
    return this.tracks.size;
  }

  // Every stored track, in the order they were added.
  public all(): Track[] {
    return Array.from(this.tracks.values());
  }

  // Replace a stored track with a new version of it (same id).
  // Keeps the track's place in the list. Returns false if the id is not stored.
  public update(track: Track): boolean {
    if (!this.tracks.has(track.id)) return false;
    this.tracks.set(track.id, track);
    return true;
  }
}
