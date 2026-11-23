import { app, BrowserWindow, screen, ipcMain, dialog, net, protocol } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
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
import { MEDIA_SCHEME, filePathFromMediaUrl } from './mediaUrl';

// Must happen before the app is ready
registerMediaScheme();

protocol.registerSchemesAsPrivileged([
  { scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

let audienceWin: BrowserWindow | null = null;

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

// Save the settings, then tell every window about them (so the TV updates right away)
function saveAndShare(newSettings: ControlPanelSettings): void {
  saveSettings(newSettings);
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('settings:changed', newSettings);
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

  const displayId = changes?.audienceDisplayId;
  if (displayId !== undefined) {
    if (displayId !== null && !Number.isInteger(displayId)) throw new Error('Unknown screen');
    settings.display.audienceDisplayId = displayId;
  }

  saveAndShare(settings);
  placeAudienceWindow(); // apply the screen and full-screen choice right away
  return settings;
});

// The Control Panel asks for the list of connected screens
ipcMain.handle('displays:list', () => listDisplays());

app.whenReady().then(() => {
  handleMediaRequests();

  // Serve media:// addresses by reading the real file from disk
  protocol.handle(MEDIA_SCHEME, (request) =>
    net.fetch(pathToFileURL(filePathFromMediaUrl(request.url)).toString())
  );

  // Load the saved song catalog and let the import screen talk to it
  const catalog = new CatalogStore(path.join(app.getPath('userData'), 'catalog.json'));
  catalog.load();
  registerCatalogHandlers(ipcMain, catalog);
  createHostWindow();
  createAudienceWindow();

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