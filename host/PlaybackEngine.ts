import { mediaUrlFor } from './mediaUrl';

// The part of an audio or video element the engine sets.
export interface MediaElement {
  src: string;
  playbackRate?: number;
  volume?: number;
}

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;

export class PlaybackEngine {
  private currentTrackId: string | null = null;
  private playbackSpeed: number = 1.0;
  private volume: number = 1.0;
  private callDurationSeconds: number = 55;
  private breakDurationSeconds: number = 4;
  private element: MediaElement | null = null;

  // getAddress is the catalog's lookup: track id -> file path (CatalogStore.getAddress).
  private readonly getAddress: (trackId: string) => string | undefined;

  constructor(getAddress: (trackId: string) => string | undefined = () => undefined) {
    this.getAddress = getAddress;
  }

  // Point an audio or video element at a catalog song.
  // Returns false if the id is not in the catalog, so the caller can show a message.
  public loadTrack(trackId: string, element: MediaElement): boolean {
    const filePath = this.getAddress(trackId);
    if (!filePath) return false;
    element.src = mediaUrlFor(filePath);
    this.currentTrackId = trackId;
    this.element = element;
    this.applySettingsTo(element);
    return true;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  // Speed is limited to MIN_SPEED..MAX_SPEED. Non-numbers fall back to normal speed.
  public setSpeed(speed: number): void {
    const value = Number.isFinite(speed) ? speed : 1.0;
    this.playbackSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
    if (this.element) this.element.playbackRate = this.playbackSpeed;
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  // Volume is 0 (silent) to 1 (full).
  public setVolume(volume: number): void {
    const value = Number.isFinite(volume) ? volume : 1.0;
    this.volume = Math.min(1, Math.max(0, value));
    if (this.element) this.element.volume = this.volume;
  }

  public getVolume(): number {
    return this.volume;
  }

  // Call and break lengths are in whole seconds, never negative.
  public setCallDuration(seconds: number): void {
    this.callDurationSeconds = Math.max(0, Math.round(seconds) || 0);
  }

  public getCallDuration(): number {
    return this.callDurationSeconds;
  }

  public setBreakDuration(seconds: number): void {
    this.breakDurationSeconds = Math.max(0, Math.round(seconds) || 0);
  }

  public getBreakDuration(): number {
    return this.breakDurationSeconds;
  }

  private applySettingsTo(element: MediaElement): void {
    element.playbackRate = this.playbackSpeed;
    element.volume = this.volume;
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
