import { Track } from './index';
import { mediaUrlFor } from './mediaUrl';

export class PlaybackEngine {
  private currentTrackId: string | null = null;
  private playbackSpeed: number = 1.0;
  private callDurationTimer: NodeJS.Timeout | null = null;

  // getAddress is the catalog's lookup: track id -> file path (CatalogStore.getAddress).
  constructor(private readonly getAddress: (trackId: string) => string | undefined = () => undefined) {}

  // Point an audio or video element at a catalog song.
  // Returns false if the id is not in the catalog, so the caller can show a message.
  public loadTrack(trackId: string, element: { src: string }): boolean {
    const filePath = this.getAddress(trackId);
    if (!filePath) return false;
    element.src = mediaUrlFor(filePath);
    this.currentTrackId = trackId;
    return true;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public setSpeed(speed: number): void {
    this.playbackSpeed = speed;
    // Apply speed to HTML5 audio element reference
  }

  public getRandomizedStartTime(trackDuration: number): number {
    // Generates a random start point, leaving at least 30s buffer for playback
    const maxStart = Math.max(0, trackDuration - 30);
    return Math.floor(Math.random() * maxStart);
  }

  public applyVolumeFadeOut(audioElement: HTMLAudioElement, durationMs: number): void {
    let step = 50; // step every 50ms
    let volumeStep = audioElement.volume / (durationMs / step);

    let fadeInterval = setInterval(() => {
      if (audioElement.volume > volumeStep) {
        audioElement.volume -= volumeStep;
      } else {
        audioElement.volume = 0;
        clearInterval(fadeInterval);
        audioElement.pause();
      }
    }, step);
  }
}
