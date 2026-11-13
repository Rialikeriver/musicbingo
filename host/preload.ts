import { contextBridge, ipcRenderer } from 'electron';

// The only things the windows are allowed to do
contextBridge.exposeInMainWorld('bingo', {
  sendToAudience: (text: string) => ipcRenderer.send('audience-text', text),
  onAudienceText: (callback: (text: string) => void) =>
    ipcRenderer.on('audience-text', (_event, text: string) => callback(text)),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  chooseFile: (key: string) => ipcRenderer.invoke('settings:chooseFile', key),
  addBanners: () => ipcRenderer.invoke('settings:addBanners'),
  removeBanner: (bannerPath: string) => ipcRenderer.invoke('settings:removeBanner', bannerPath),
  updateOptions: (changes: object) => ipcRenderer.invoke('settings:updateOptions', changes),
  // Run "callback" every time the settings change; returns a function that stops listening
  onSettingsChanged: (callback: (settings: unknown) => void) => {
    const listener = (_event: unknown, settings: unknown) => callback(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => { ipcRenderer.removeListener('settings:changed', listener); };
  }
});