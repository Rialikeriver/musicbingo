import { app, BrowserWindow, screen, ipcMain, net, protocol } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { CatalogStore } from './CatalogStore';
import { registerCatalogHandlers } from './catalogIpc';
import { MEDIA_SCHEME, filePathFromMediaUrl } from './mediaUrl';

// Must be called before the app is ready. Lets the screens play songs from media:// addresses.
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

app.whenReady().then(() => {
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});