import { Track } from '../types';

export class PlaybackEngine {
  private currentTrack: Track | null = null;
  private playbackSpeed: number = 1.0;
  private callDurationTimer: NodeJS.Timeout | null = null;

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
