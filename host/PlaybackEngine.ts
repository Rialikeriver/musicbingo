import type { Track } from './index';
import { mediaUrlFor } from './mediaUrl';

// The part of an audio or video element the engine sets.
export interface MediaElement {
  src: string;
  playbackRate?: number;
  volume?: number;
}

// An element the engine can also start, pause and move through a song.
export interface PlayableElement extends MediaElement {
  currentTime: number;
  play(): Promise<void> | void;
  pause(): void;
}

export type PlayState = 'stopped' | 'playing' | 'breaking' | 'paused' | 'finished';

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;
export const FADE_MS = 2000; // the volume fade at the end of a call
const FADE_STEP_MS = 100;

export interface EngineOptions {
  getAddress?: (trackId: string) => string | undefined;
  getTrack?: (trackId: string) => Track | undefined;
  // Timers can be replaced in tests. The defaults are the real timers.
  schedule?: (callback: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
  random?: () => number;
}

export class PlaybackEngine {
  private currentTrackId: string | null = null;
  private playbackSpeed: number = 1.0;
  private volume: number = 1.0;
  private callDurationSeconds: number = 55;
  private breakDurationSeconds: number = 4;
  private fadeOut: boolean = true;
  private randomStart: boolean = false;

  // The element the settings are applied to (the last one loadTrack used).
  private target: MediaElement | null = null;
  // The element the call list plays on, set by start().
  private player: PlayableElement | null = null;
  private queue: string[] = [];
  private index: number = 0;
  private state: PlayState = 'stopped';
  private pausedDuring: 'song' | 'break' = 'song';
  // Where the current call stops, in seconds of the song.
  private callEndsAt: number = 0;
  private timers: unknown[] = [];

  private readonly getAddress: (trackId: string) => string | undefined;
  private readonly getTrack: (trackId: string) => Track | undefined;
  private readonly schedule: (callback: () => void, ms: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private readonly random: () => number;

  constructor(options: EngineOptions = {}) {
    this.getAddress = options.getAddress ?? (() => undefined);
    this.getTrack = options.getTrack ?? (() => undefined);
    this.schedule = options.schedule ?? ((callback, ms) => setTimeout(callback, ms));
    this.cancel = options.cancel ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
    this.random = options.random ?? Math.random;
  }

  // Point an audio or video element at a catalog song.
  // Returns false if the id is not in the catalog, so the caller can skip it.
  public loadTrack(trackId: string, element: MediaElement): boolean {
    const filePath = this.getAddress(trackId);
    if (!filePath) return false;
    element.src = mediaUrlFor(filePath);
    this.currentTrackId = trackId;
    this.target = element;
    this.applySettingsTo(element);
    return true;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public getState(): PlayState {
    return this.state;
  }

  // Plays the list in order: each song for its call length, then the break.
  // If the list is paused on this same element, this resumes it instead.
  public start(trackIds: string[], element: PlayableElement): boolean {
    if (this.state === 'paused' && this.player === element) return this.resume();
    if (trackIds.length === 0) return false;
    this.clearTimers();
    this.player = element;
    this.queue = [...trackIds];
    this.index = 0;
    return this.playCurrent();
  }

  public pause(): void {
    if (this.state !== 'playing' && this.state !== 'breaking') return;
    this.pausedDuring = this.state === 'playing' ? 'song' : 'break';
    this.clearTimers();
    this.player?.pause();
    this.state = 'paused';
  }

  // Next skips straight to the following song.
  public next(): void {
    if (this.state === 'stopped' || this.state === 'finished') return;
    this.clearTimers();
    this.player?.pause();
    this.nextSong();
  }

  public stop(): void {
    this.clearTimers();
    this.player?.pause();
    this.index = 0;
    this.state = 'stopped';
  }

  // Speed is limited to MIN_SPEED..MAX_SPEED. Non-numbers fall back to normal speed.
  public setSpeed(speed: number): void {
    const value = Number.isFinite(speed) ? speed : 1.0;
    this.playbackSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
    if (this.target) this.target.playbackRate = this.playbackSpeed;
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  // Volume is 0 (silent) to 1 (full).
  public setVolume(volume: number): void {
    const value = Number.isFinite(volume) ? volume : 1.0;
    this.volume = Math.min(1, Math.max(0, value));
    if (this.target) this.target.volume = this.volume;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setFadeOut(on: boolean): void {
    this.fadeOut = on;
  }

  public getFadeOut(): boolean {
    return this.fadeOut;
  }

  // When on, each call starts at a random point inside the song's crop.
  public setRandomStart(on: boolean): void {
    this.randomStart = on;
  }

  public getRandomStart(): boolean {
    return this.randomStart;
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

  // Generates a random start point, leaving at least 30s buffer for playback
  public getRandomizedStartTime(trackDuration: number): number {
    const maxStart = Math.max(0, trackDuration - 30);
    return Math.floor(this.random() * maxStart);
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

  // Plays the song at the current index. Songs that are not in the catalog are skipped.
  private playCurrent(): boolean {
    while (this.index < this.queue.length) {
      const trackId = this.queue[this.index];
      const player = this.player;
      if (!player || !this.loadTrack(trackId, player)) {
        this.index += 1;
        continue;
      }
      const track = this.getTrack(trackId);
      const startAt = this.chooseStart(track);
      player.currentTime = startAt;
      this.callEndsAt = startAt + this.callLength(track, startAt);
      this.state = 'playing';
      this.startPlayback(player);
      return true;
    }
    this.state = 'finished';
    return false;
  }

  private startPlayback(player: PlayableElement): void {
    try {
      Promise.resolve(player.play()).catch(() => this.playbackFailed());
    } catch {
      this.playbackFailed();
      return;
    }
    this.scheduleCallEnd();
  }

  // The browser would not play (for example, the file is missing). Stop instead of skipping silently.
  private playbackFailed(): void {
    this.clearTimers();
    this.pausedDuring = 'song';
    this.state = 'paused';
  }

  private resume(): boolean {
    const player = this.player;
    if (!player) return false;
    if (this.pausedDuring === 'break') {
      this.state = 'breaking';
      this.later(() => this.nextSong(), this.breakDurationSeconds * 1000);
      return true;
    }
    this.state = 'playing';
    player.volume = this.volume;
    this.startPlayback(player);
    return true;
  }

  // Start point for a song: the crop start, or a random point inside the crop when that is on.
  private chooseStart(track: Track | undefined): number {
    if (!track) return 0;
    const begin = track.startTime || 0;
    const end = track.endTime || track.duration;
    const span = Math.max(0, end - begin);
    if (!this.randomStart) return begin;
    const slack = Math.max(0, span - Math.min(this.callDurationSeconds, span));
    return begin + this.random() * slack;
  }

  // How much of the song this call plays: the call length, but never past the crop end.
  private callLength(track: Track | undefined, startAt: number): number {
    const end = track ? (track.endTime || track.duration) : Infinity;
    return Math.max(0, Math.min(this.callDurationSeconds, end - startAt));
  }

  // Waits until the call is nearly over, then fades the volume out (when that is on).
  private scheduleCallEnd(): void {
    const player = this.player;
    if (!player) return;
    const left = Math.max(0, this.callEndsAt - player.currentTime);
    const fade = this.fadeOut ? Math.min(FADE_MS / 1000, left) : 0;
    this.later(() => this.fadeStep(fade, 0), ((left - fade) * 1000) / this.playbackSpeed);
  }

  private fadeStep(total: number, done: number): void {
    const player = this.player;
    if (!player || this.state !== 'playing') return;
    if (done >= total) {
      this.endCall();
      return;
    }
    player.volume = this.volume * (1 - done / total);
    const step = Math.min(FADE_STEP_MS / 1000, total - done);
    this.later(() => this.fadeStep(total, done + step), (step * 1000) / this.playbackSpeed);
  }

  private endCall(): void {
    const player = this.player;
    if (!player) return;
    player.pause();
    player.volume = this.volume;
    this.state = 'breaking';
    this.later(() => this.nextSong(), this.breakDurationSeconds * 1000);
  }

  private nextSong(): void {
    this.index += 1;
    if (this.index >= this.queue.length) {
      this.player?.pause();
      this.state = 'finished';
      return;
    }
    this.playCurrent();
  }

  // Timers are kept so pause, next and stop can cancel them.
  private later(callback: () => void, ms: number): void {
    this.timers.push(this.schedule(callback, ms));
  }

  private clearTimers(): void {
    for (const handle of this.timers) this.cancel(handle);
    this.timers = [];
  }

  private applySettingsTo(element: MediaElement): void {
    element.playbackRate = this.playbackSpeed;
    element.volume = this.volume;
  }
}
