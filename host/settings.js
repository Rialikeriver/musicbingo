const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Every setting the Control Panel holds, with its starting value
const DEFAULT_SETTINGS = {
  media: {
    winnerVideo: null,      // path to the copied winner video
    winnerAudio: null,      // path to the copied winner sound
    backgroundMusic: null   // path to the copied background track
  },
  branding: {
    venueLogo: null,              // path to the copied logo image
    sponsorBanners: [],           // list of paths to banner images
    bannerIntervalSeconds: 10     // how long each banner shows
  },
  display: {
    audienceDisplayId: null,  // which monitor is the venue TV (null = pick automatically)
    fullscreen: true
  }
};

// Where the settings are saved on this computer
function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

// Read saved settings; fill in anything missing with the defaults
function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf-8'));
    return {
      media:    { ...DEFAULT_SETTINGS.media,    ...saved.media },
      branding: { ...DEFAULT_SETTINGS.branding, ...saved.branding },
      display:  { ...DEFAULT_SETTINGS.display,  ...saved.display }
    };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Settings file could not be read, using defaults:', err.message);
    }
    return structuredClone(DEFAULT_SETTINGS);
  }
}

// Save settings safely: write to a temp file first, then swap it in
function saveSettings(settings) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  const tempFile = settingsPath() + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(settings, null, 2));
  fs.renameSync(tempFile, settingsPath());
}

module.exports = { DEFAULT_SETTINGS, loadSettings, saveSettings, settingsPath };