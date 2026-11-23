import { contextBridge, ipcRenderer, webUtils } from 'electron';

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
  },
  listDisplays: () => ipcRenderer.invoke('displays:list'),
  // Run "callback" every time a screen is plugged in or unplugged; returns a "stop listening" function
  onDisplaysChanged: (callback: (displays: unknown) => void) => {
    const listener = (_event: unknown, displays: unknown) => callback(displays);
    ipcRenderer.on('displays:changed', listener);
    return () => { ipcRenderer.removeListener('displays:changed', listener); };
  },
  showCommercialNow: () => ipcRenderer.invoke('commercial:showNow'),
  // Run "callback" when the commercial should appear on the TV; returns a "stop listening" function
  onCommercialShow: (callback: (commercial: unknown) => void) => {
    const listener = (_event: unknown, commercial: unknown) => callback(commercial);
    ipcRenderer.on('commercial:show', listener);
    return () => { ipcRenderer.removeListener('commercial:show', listener); };
  }
});

// Gives the screens (renderer) safe access to the song catalog that lives in the host process.
// The screens call these functions as window.catalogApi.<name>(...).
//
// Electron runs this file in a sandbox that cannot load other project files,
// so the channel names are written out here. They must match CATALOG_CHANNELS in host/catalogIpc.ts.
// A test in host/catalogIpc.test.ts checks that they match.
contextBridge.exposeInMainWorld('catalogApi', {
  // Electron 32 and later no longer give dropped files a .path, so ask for it here.
  getFilePath: (file: File) => webUtils.getPathForFile(file),
  importFile: (filePath: string, duration: number) =>
    ipcRenderer.invoke('catalog:import', filePath, duration),
  list: () => ipcRenderer.invoke('catalog:list'),
  remove: (id: string) => ipcRenderer.invoke('catalog:remove', id),
  updateCrop: (id: string, startTime: number, endTime: number) =>
    ipcRenderer.invoke('catalog:updateCrop', id, startTime, endTime),
});
