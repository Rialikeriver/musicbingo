// the main file with the most common variables we will all need access to 
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  filePath: string;
  previewUrl?: string;
  startTime: number; // in seconds (for cropping/randomization)
  endTime: number;
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


// Control Panel settings (owned by the Control Panel / Task 3)
export interface ControlPanelSettings {
  media: {
    winnerVideo: string | null;
    winnerAudio: string | null;
    backgroundMusic: string | null;
  };
  branding: {
    venueLogo: string | null;
    sponsorBanners: string[];
    bannerIntervalSeconds: number;
  };
  display: {
    audienceDisplayId: number | null;
    fullscreen: boolean;
  };
  commercial: {
    image: string | null;     // path to the copied GIF or PNG
    enabled: boolean;         // show it automatically on a timer
    intervalMinutes: number;  // how often, e.g. every 15 minutes
    durationSeconds: number;  // how long it stays on the TV each time
  };
}


// The Control Panel settings that hold one chosen file
export type MediaSettingKey = 'venueLogo' | 'winnerVideo' | 'winnerAudio' | 'backgroundMusic' | 'commercialImage';


export interface ControlPanelOptions {
  bannerIntervalSeconds?: number;
  fullscreen?: boolean;
  audienceDisplayId?: number | null; // null = automatic
  commercialEnabled?: boolean;
  commercialIntervalMinutes?: number;
  commercialDurationSeconds?: number;
}

// One connected screen, as shown in the Control Panel's "Show on" list
export interface DisplayInfo {
  id: number;
  label: string;      // e.g. "Screen 2 – 1920 × 1080"
  isPrimary: boolean; // true for the laptop's own screen
}