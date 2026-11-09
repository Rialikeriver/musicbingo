import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { ControlPanelSettings } from './index';


// Starting values used on first launch
export const DEFAULT_SETTINGS: ControlPanelSettings = {
  media: { winnerVideo: null, winnerAudio: null, backgroundMusic: null },
  branding: { venueLogo: null, sponsorBanners: [], bannerIntervalSeconds: 10 },
  display: { audienceDisplayId: null, fullscreen: true }
};

// Where the settings file lives on this computer
export function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

// Read saved settings; fill in anything missing with the defaults
export function loadSettings(): ControlPanelSettings {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf-8')) as Partial<ControlPanelSettings>;
    return {
      media:    { ...DEFAULT_SETTINGS.media,    ...saved.media },
      branding: { ...DEFAULT_SETTINGS.branding, ...saved.branding },
      display:  { ...DEFAULT_SETTINGS.display,  ...saved.display }
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Settings file could not be read, using defaults:', (err as Error).message);
    }
    return structuredClone(DEFAULT_SETTINGS);
  }
}

// Save safely: write to a temp file first, then swap it in
export function saveSettings(settings: ControlPanelSettings): void {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  const tempFile = settingsPath() + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(settings, null, 2));
  fs.renameSync(tempFile, settingsPath());
}