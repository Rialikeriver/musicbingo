const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bingo', {
  sendToAudience: (text) => ipcRenderer.send('audience-text', text),
  onAudienceText: (callback) =>
    ipcRenderer.on('audience-text', (_event, text) => callback(text))
});