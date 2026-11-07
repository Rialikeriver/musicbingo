import type { Track } from '../../host/index';

// The catalog functions the host process exposes to the screens (see host/preload.ts).
export interface CatalogApi {
  importFile(filePath: string, duration: number): Promise<Track | null>;
  list(): Promise<Track[]>;
  remove(id: string): Promise<boolean>;
  updateCrop(id: string, startTime: number, endTime: number): Promise<Track | null>;
}

declare global {
  interface Window {
    // Only present when running inside the Electron app, not in a plain browser preview.
    catalogApi?: CatalogApi;
  }
}

export {};
