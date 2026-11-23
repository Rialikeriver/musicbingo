import { app, BrowserWindow, screen, ipcMain, dialog } from 'electron';
import path from 'path';
import { loadSettings, saveSettings } from './settings';
import type { ControlPanelOptions, ControlPanelSettings } from './index';
import {
  FILE_FILTERS, isMediaSettingKey, copyIntoMediaFolder,
  removeOldCopy, getMediaSetting, setMediaSetting,
  registerMediaScheme, handleMediaRequests
} from './mediaFiles';
import { listDisplays, chooseAudienceDisplay } from './displays';
import { CatalogStore } from './CatalogStore';
import { registerCatalogHandlers } from './catalogIpc';

// Must happen before the app is ready
registerMediaScheme();

let audienceWin: BrowserWindow | null = null;
let commercialTimer: NodeJS.Timeout | null = null;
let commercialTimerKey = ''; // the settings the current timer was started with

const webPreferences = { preload: path.join(__dirname, 'preload.js') };

// While developing, the screens come from Vite (run "npm run dev" inside renderer/)
const DEV_SERVER_URL = 'http://localhost:5173';

// Open one of Hoang's screens: 'host' or 'audience'
function loadScreen(win: BrowserWindow, screenName: 'host' | 'audience'): void {
  if (app.isPackaged) {
    // Finished app: load the built screens from renderer/dist
    win.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'), { hash: `/${screenName}` });
  } else {
    // Development: load from the Vite dev server
    win.loadURL(`${DEV_SERVER_URL}/#/${screenName}`);
  }
}

function createHostWindow(): void {
  const hostWin = new BrowserWindow({ width: 1280, height: 800, title: 'Host', webPreferences });
  loadScreen(hostWin, 'host');
}

function createAudienceWindow(): void {
  audienceWin = new BrowserWindow({ width: 800, height: 600, title: 'Audience', webPreferences });
  placeAudienceWindow();
  loadScreen(audienceWin, 'audience');
  audienceWin.on('closed', () => { audienceWin = null; });
}

// Put the TV window on the right screen (called at start, when a setting changes,
// and when a screen is plugged in or unplugged)
function placeAudienceWindow(): void {
  if (!audienceWin) return;
  const settings = loadSettings();
  const { display, isExternal } = chooseAudienceDisplay(settings.display.audienceDisplayId);

  audienceWin.setFullScreen(false); // leave full screen before moving
  if (isExternal) {
    audienceWin.setBounds(display.bounds);
    audienceWin.setFullScreen(settings.display.fullscreen);
  } else {
    // Only the laptop: a normal window, never full screen (it would hide the host's controls)
    const area = display.workArea;
    audienceWin.setBounds({ x: area.x + 850, y: area.y + 50, width: 800, height: 600 });
  }
  console.log('TV window on:', isExternal ? `external screen ${display.id}` : 'this laptop');
}

// Tell every window that the list of screens changed
function shareDisplays(): void {
  const displays = listDisplays();
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('displays:changed', displays);
  }
}

// True when two file paths point to the same file (Windows ignores upper/lower case)
function samePath(a: string, b: string): boolean {
  const normalize = (p: string) => path.normalize(p).toLowerCase();
  return normalize(a) === normalize(b);
}

// Save the settings, then tell every window about them (so the TV updates right away)
function saveAndShare(newSettings: ControlPanelSettings): void {
  saveSettings(newSettings);
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('settings:changed', newSettings);
  }
  updateCommercialTimer();
}

// Show the commercial on the TV once (if one is chosen)
function showCommercial(): void {
  const commercial = loadSettings().commercial;
  if (!commercial.image) return;
  audienceWin?.webContents.send('commercial:show', {
    image: commercial.image,
    durationSeconds: commercial.durationSeconds
  });
}

// Start, restart or stop the commercial timer to match the settings
function updateCommercialTimer(): void {
  const commercial = loadSettings().commercial;
  const key = `${commercial.enabled}|${commercial.image}|${commercial.intervalMinutes}`;
  if (key === commercialTimerKey) return; // nothing that affects the timer changed
  commercialTimerKey = key;

  if (commercialTimer) clearInterval(commercialTimer);
  commercialTimer = null;
  if (commercial.enabled && commercial.image) {
    commercialTimer = setInterval(showCommercial, commercial.intervalMinutes * 60 * 1000);
  }
}

// When the host sends text, pass it to the audience window
ipcMain.on('audience-text', (_event, text: string) => {
  audienceWin?.webContents.send('audience-text', text);
});

// When a screen asks for the settings, read them from the settings file
ipcMain.handle('settings:get', () => loadSettings());

// "Choose file…": open the file picker, copy the file into the app, save it in settings
ipcMain.handle('settings:chooseFile', async (event, key: unknown) => {
  if (!isMediaSettingKey(key)) throw new Error(`Unknown setting: ${String(key)}`);

  const options: Electron.OpenDialogOptions = {
    title: 'Choose a file',
    properties: ['openFile'],
    filters: FILE_FILTERS[key]
  };
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);

  const settings = loadSettings();
  if (result.canceled || result.filePaths.length === 0) return settings; // host pressed Cancel

  const oldCopy = getMediaSetting(settings, key);
  const newCopy = copyIntoMediaFolder(result.filePaths[0], key);
  setMediaSetting(settings, key, newCopy);
  saveAndShare(settings);
  removeOldCopy(oldCopy);
  return settings;
});

// "Add banner…": pick one or more images, copy them, add them to the banner list
ipcMain.handle('settings:addBanners', async (event) => {
  const options: Electron.OpenDialogOptions = {
    title: 'Choose sponsor banner images',
    properties: ['openFile', 'multiSelections'],
    filters: FILE_FILTERS.venueLogo // same image types as the logo
  };
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);

  const settings = loadSettings();
  if (result.canceled || result.filePaths.length === 0) return settings; // host pressed Cancel

  for (const filePath of result.filePaths) {
    settings.branding.sponsorBanners.push(copyIntoMediaFolder(filePath, 'banner'));
  }
  saveAndShare(settings);
  return settings;
});

// "Remove": take one banner out of the list and delete its copy
ipcMain.handle('settings:removeBanner', (_event, bannerPath: unknown) => {
  const settings = loadSettings();
  // Only remove a path that is really in the banner list
  if (typeof bannerPath !== 'string' || !settings.branding.sponsorBanners.includes(bannerPath)) {
    return settings;
  }
  settings.branding.sponsorBanners = settings.branding.sponsorBanners.filter(p => p !== bannerPath);
  saveAndShare(settings);
  removeOldCopy(bannerPath);
  return settings;
});

// Typing "Seconds per banner", ticking "Full screen" or choosing "Show on": check, then save
ipcMain.handle('settings:updateOptions', (_event, changes: ControlPanelOptions) => {
  const settings = loadSettings();

  const seconds = changes?.bannerIntervalSeconds;
  if (seconds !== undefined) {
    if (!Number.isInteger(seconds) || seconds < 3 || seconds > 120) {
      throw new Error('Seconds per banner must be a whole number from 3 to 120');
    }
    settings.branding.bannerIntervalSeconds = seconds;
  }

  const fullscreen = changes?.fullscreen;
  if (fullscreen !== undefined) {
    if (typeof fullscreen !== 'boolean') throw new Error('Full screen must be true or false');
    settings.display.fullscreen = fullscreen;
  }

  // A whole number between min and max, or an error
  const checkWhole = (value: unknown, min: number, max: number, name: string): number => {
    if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
      throw new Error(`${name} must be a whole number from ${min} to ${max}`);
    }
    return value as number;
  };

  if (changes?.commercialEnabled !== undefined) {
    if (typeof changes.commercialEnabled !== 'boolean') throw new Error('Commercial on/off must be true or false');
    settings.commercial.enabled = changes.commercialEnabled;
  }
  if (changes?.commercialIntervalMinutes !== undefined) {
    settings.commercial.intervalMinutes = checkWhole(changes.commercialIntervalMinutes, 1, 120, 'Minutes between commercials');
  }
  if (changes?.commercialDurationSeconds !== undefined) {
    settings.commercial.durationSeconds = checkWhole(changes.commercialDurationSeconds, 5, 120, 'Seconds on screen');
  }

  const displayId = changes?.audienceDisplayId;
  if (displayId !== undefined) {
    if (displayId !== null && !Number.isInteger(displayId)) throw new Error('Unknown screen');
    settings.display.audienceDisplayId = displayId;
  }

  saveAndShare(settings);
  placeAudienceWindow(); // apply the screen and full-screen choice right away
  return settings;
});

// "Show now" button in the Control Panel
ipcMain.handle('commercial:showNow', () => showCommercial());

// The Control Panel asks for the list of connected screens
ipcMain.handle('displays:list', () => listDisplays());

app.whenReady().then(() => {
  // Load the saved song catalog and let the import screen talk to it (Harpreet)
  const catalog = new CatalogStore(path.join(app.getPath('userData'), 'catalog.json'));
  catalog.load();
  registerCatalogHandlers(ipcMain, catalog);

  // One media:// handler for everything:
  //   media://files/...  -> logo, banners, commercial (app's media folder)
  //   media://local/...  -> songs, but only songs that are in the catalog
  handleMediaRequests((filePath) => catalog.list().some((track) => samePath(track.filePath, filePath)));

  createHostWindow();
  createAudienceWindow();
  updateCommercialTimer();

  // A TV or projector was plugged in, unplugged, or changed resolution
  const onScreensChanged = () => {
    placeAudienceWindow();
    shareDisplays();
  };
  screen.on('display-added', onScreensChanged);
  screen.on('display-removed', onScreensChanged);
  screen.on('display-metrics-changed', onScreensChanged);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});