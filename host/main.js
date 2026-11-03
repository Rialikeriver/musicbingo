const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { loadSettings, saveSettings, settingsPath } = require('./settings');

let audienceWin;

const webPreferences = { preload: path.join(__dirname, 'preload.js') };

function createHostWindow() {
  const hostWin = new BrowserWindow({ width: 800, height: 600, title: 'Host', webPreferences });
  hostWin.loadFile(path.join(__dirname, 'host.html'));
}

function createAudienceWindow() {
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

  audienceWin.loadFile(path.join(__dirname, 'audience.html'));
}

// When the host sends text, pass it to the audience window
ipcMain.on('audience-text', (_event, text) => {
  if (audienceWin) audienceWin.webContents.send('audience-text', text);
});

app.whenReady().then(() => {
  // TEST: will remove after checking
  const s = loadSettings();
  console.log('Loaded:', s.branding.bannerIntervalSeconds);
  s.branding.bannerIntervalSeconds = 15;
  saveSettings(s);
  console.log('Saved to:', settingsPath());

  createHostWindow();
  createAudienceWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});