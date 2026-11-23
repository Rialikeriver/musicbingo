import { CatalogStore } from './CatalogStore';

// The channel names used between the screens and the host process.
// The preload file uses the same names.
export const CATALOG_CHANNELS = {
  import: 'catalog:import',
  list: 'catalog:list',
  remove: 'catalog:remove',
  updateCrop: 'catalog:updateCrop',
} as const;

// The part of Electron's ipcMain this file uses.
// Typing it here (instead of importing Electron) means this file can be tested without Electron.
export interface IpcHandleTarget {
  handle(channel: string, listener: (...args: any[]) => unknown): void;
}

// Connect the catalog store to the IPC channels.
export function registerCatalogHandlers(ipc: IpcHandleTarget, store: CatalogStore): void {
  ipc.handle(CATALOG_CHANNELS.import, (filePath: string, duration: number) =>
    store.importFile(filePath, duration)
  );
  ipc.handle(CATALOG_CHANNELS.list, () => store.list());
  ipc.handle(CATALOG_CHANNELS.remove, (id: string) => store.remove(id));
  ipc.handle(CATALOG_CHANNELS.updateCrop, (id: string, startTime: number, endTime: number) =>
    store.updateCrop(id, startTime, endTime)
  );
}
