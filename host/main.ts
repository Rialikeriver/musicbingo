import { app, BrowserWindow, screen, ipcMain, dialog } from 'electron';
import path from 'path';
import { loadSettings, saveSettings } from './settings';
import {
  FILE_FILTERS, isMediaSettingKey, copyIntoMediaFolder,
  removeOldCopy, getMediaSetting, setMediaSetting
} from './mediaFiles';

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
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const external = displays.find(d => d.id !== primary.id);

  console.log('Displays found:', displays.length);

  if (external) {
    const { x, y, width, height } = external.bounds;
    audienceWin = new BrowserWindow({ x, y, width, height, title: 'Audience', webPreferences });
    audienceWin.setFullScreen(true);
  } else {
    audienceWin = new BrowserWindow({ width: 800, height: 600, x: 850, y: 50, title: 'Audience', webPreferences });
  }

  loadScreen(audienceWin, 'audience');
  audienceWin.on('closed', () => { audienceWin = null; });
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
  saveSettings(settings);
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
  saveSettings(settings);
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
  saveSettings(settings);
  removeOldCopy(bannerPath);
  return settings;
});

app.whenReady().then(() => {
  createHostWindow();
  createAudienceWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});