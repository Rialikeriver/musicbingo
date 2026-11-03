import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';

let audienceWin: BrowserWindow | null = null;

const webPreferences = { preload: path.join(__dirname, 'preload.js') };

// Compiled code runs from dist/, but the HTML pages are still in host/
const pagesDir = path.join(__dirname, '..', 'host');

function createHostWindow(): void {
  const hostWin = new BrowserWindow({ width: 800, height: 600, title: 'Host', webPreferences });
  hostWin.loadFile(path.join(pagesDir, 'host.html'));
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

  audienceWin.loadFile(path.join(pagesDir, 'audience.html'));
  audienceWin.on('closed', () => { audienceWin = null; });
}

// When the host sends text, pass it to the audience window
ipcMain.on('audience-text', (_event, text: string) => {
  audienceWin?.webContents.send('audience-text', text);
});

app.whenReady().then(() => {
  createHostWindow();
  createAudienceWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});