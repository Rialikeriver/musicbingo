// the main file with the most common variables we will all need access to 
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  filePath: string;
  startTime: number; // in seconds (for cropping/randomization)
  duration: number;
}

export interface GameConfig {
  callDuration: number; // seconds per song call
  breakDuration: number; // seconds between songs
  playSpeed: number;
  fadeOutDuration: number;
  commercialIntervalSeconds: number;
  watermarkText: string;
}

export type WinningPattern = 'horizontal' | 'vertical' | 'diagonal' | 'corners' | 'L' | 'T' | 'X' | 'custom';

export interface CustomPattern {
  name: string;
  grid: boolean[][];
}
