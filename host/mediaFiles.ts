import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { ControlPanelSettings, MediaSettingKey } from './index';

// Which file types the picker allows for each setting
export const FILE_FILTERS: Record<MediaSettingKey, { name: string; extensions: string[] }[]> = {
  venueLogo:       [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
  winnerVideo:     [{ name: 'Videos', extensions: ['mp4', 'webm'] }],
  winnerAudio:     [{ name: 'Audio',  extensions: ['mp3', 'wav', 'm4a', 'ogg'] }],
  backgroundMusic: [{ name: 'Audio',  extensions: ['mp3', 'wav', 'm4a', 'ogg'] }]
};

// True only for the four names above (screens could send anything)
export function isMediaSettingKey(key: unknown): key is MediaSettingKey {
  return typeof key === 'string' && key in FILE_FILTERS;
}

// The app's own folder for copied media files
export function mediaFolder(): string {
  return path.join(app.getPath('userData'), 'media');
}

// Copy a chosen file into the media folder under a new, unique name
// (prefix is the start of the name, e.g. "venueLogo" or "banner")
export function copyIntoMediaFolder(sourcePath: string, prefix: string): string {
  fs.mkdirSync(mediaFolder(), { recursive: true });
  const extension = path.extname(sourcePath).toLowerCase();
  const uniquePart = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const destination = path.join(mediaFolder(), `${prefix}-${uniquePart}${extension}`);
  fs.copyFileSync(sourcePath, destination);
  return destination;
}

// Delete an old copy, but only if it is inside our media folder
export function removeOldCopy(filePath: string | null): void {
  if (!filePath) return;
  if (path.dirname(filePath) !== mediaFolder()) return;
  fs.rmSync(filePath, { force: true });
}

// Read or change one file setting (the logo lives in "branding", the rest in "media")
export function getMediaSetting(settings: ControlPanelSettings, key: MediaSettingKey): string | null {
  return key === 'venueLogo' ? settings.branding.venueLogo : settings.media[key];
}

export function setMediaSetting(settings: ControlPanelSettings, key: MediaSettingKey, value: string | null): void {
  if (key === 'venueLogo') settings.branding.venueLogo = value;
  else settings.media[key] = value;
}