import { contextBridge, ipcRenderer } from 'electron';
import { CATALOG_CHANNELS } from './catalogIpc';

// Gives the screens (renderer) safe access to the song catalog that lives in the host process.
// The screens call these functions as window.catalogApi.<name>(...).
contextBridge.exposeInMainWorld('catalogApi', {
  importFile: (filePath: string, duration: number) =>
    ipcRenderer.invoke(CATALOG_CHANNELS.import, filePath, duration),
  list: () => ipcRenderer.invoke(CATALOG_CHANNELS.list),
  remove: (id: string) => ipcRenderer.invoke(CATALOG_CHANNELS.remove, id),
  updateCrop: (id: string, startTime: number, endTime: number) =>
    ipcRenderer.invoke(CATALOG_CHANNELS.updateCrop, id, startTime, endTime),
});
