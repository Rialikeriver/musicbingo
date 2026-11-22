import { app, protocol, net } from 'electron';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { pathToFileURL } from 'url';
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


// media:// addresses, so screens can show files from the media folder

// Step 1 (before the app is ready): tell Electron "media://" is a safe address type
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
  ]);
}

// Step 2 (after the app is ready): answer requests like media://files/banner-123.png
export function handleMediaRequests(): void {
  protocol.handle('media', (request) => {
    const requested = decodeURIComponent(new URL(request.url).pathname);
    const name = path.basename(requested);          // drop any folders, e.g. "../../"
    const filePath = path.join(mediaFolder(), name); // only ever look inside the media folder
    if (!name || !fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}