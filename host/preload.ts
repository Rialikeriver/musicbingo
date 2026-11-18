import { contextBridge, ipcRenderer, webUtils } from 'electron';

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
