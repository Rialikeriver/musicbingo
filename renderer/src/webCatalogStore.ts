import type { Track } from '../../host/index';

export interface NamedCatalog {
  id: string;
  name: string;
  tracks: Track[];
}

interface CatalogStoreState {
  activeCatalogId: string;
  catalogs: NamedCatalog[];
}

const STORAGE_KEY = 'music_bingo_named_catalogs_v1';

function makeDefaultState(): CatalogStoreState {
  const defaultId = 'cat-bingo-1';
  return {
    activeCatalogId: defaultId,
    catalogs: [
      {
        id: defaultId,
        name: 'Bingo 1',
        tracks: [],
      },
    ],
  };
}

function readState(): CatalogStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultState();
    const parsed = JSON.parse(raw) as CatalogStoreState;
    if (!Array.isArray(parsed.catalogs) || parsed.catalogs.length === 0) {
      return makeDefaultState();
    }
    const activeExists = parsed.catalogs.some((c) => c.id === parsed.activeCatalogId);
    return {
      activeCatalogId: activeExists ? parsed.activeCatalogId : parsed.catalogs[0].id,
      catalogs: parsed.catalogs.map((c) => ({
        id: c.id,
        name: c.name || 'Untitled Catalog',
        tracks: Array.isArray(c.tracks)
          ? c.tracks.map(({ previewUrl: _ignored, ...rest }) => rest)
          : [],
      })),
    };
  } catch {
    return makeDefaultState();
  }
}

function writeState(state: CatalogStoreState): void {
  try {
    const cleanState: CatalogStoreState = {
      activeCatalogId: state.activeCatalogId,
      catalogs: state.catalogs.map((c) => ({
        ...c,
        tracks: c.tracks.map(({ previewUrl: _ignored, ...rest }) => rest),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
  } catch {
    // Ignore storage quota errors
  }
}

export const namedCatalogStore = {
  listCatalogs(): NamedCatalog[] {
    return readState().catalogs;
  },

  getActiveCatalogId(): string {
    return readState().activeCatalogId;
  },

  setActiveCatalogId(catalogId: string): NamedCatalog | null {
    const state = readState();
    const found = state.catalogs.find((c) => c.id === catalogId);
    if (!found) return null;
    writeState({ ...state, activeCatalogId: found.id });
    return found;
  },

  createCatalog(name: string): NamedCatalog {
    const state = readState();
    const trimmed = name.trim() || `Catalog ${state.catalogs.length + 1}`;
    const newCatalog: NamedCatalog = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      tracks: [],
    };
    writeState({
      activeCatalogId: newCatalog.id,
      catalogs: [...state.catalogs, newCatalog],
    });
    return newCatalog;
  },

  renameCatalog(catalogId: string, newName: string): NamedCatalog | null {
    const trimmed = newName.trim();
    if (!trimmed) return null;
    const state = readState();
    const idx = state.catalogs.findIndex((c) => c.id === catalogId);
    if (idx === -1) return null;
    const updated: NamedCatalog = { ...state.catalogs[idx], name: trimmed };
    const nextCatalogs = [...state.catalogs];
    nextCatalogs[idx] = updated;
    writeState({ ...state, catalogs: nextCatalogs });
    return updated;
  },
};

function getActiveCatalog(state: CatalogStoreState): NamedCatalog {
  return state.catalogs.find((c) => c.id === state.activeCatalogId) ?? state.catalogs[0];
}

export const webCatalogApi = {
  getFilePath(file: File): string {
    return file.name;
  },

  list(): Promise<Track[]> {
    const state = readState();
    return Promise.resolve(getActiveCatalog(state).tracks);
  },

  importFile(filePath: string, duration: number): Promise<Track | null> {
    const state = readState();
    const active = getActiveCatalog(state);
    const normalized = filePath.trim().toLowerCase();

    if (active.tracks.some((t) => t.filePath.trim().toLowerCase() === normalized)) {
      return Promise.resolve(null);
    }

    const baseName = filePath.split(/[\\/]/).pop() || filePath;
    const withoutExt = baseName.replace(/\.[^/.]+$/, '');
    const dashIndex = withoutExt.indexOf(' - ');

    const artist = dashIndex !== -1
      ? withoutExt.slice(0, dashIndex).trim() || 'Unknown Artist'
      : 'Unknown Artist';
    const title = dashIndex !== -1
      ? withoutExt.slice(dashIndex + 3).trim() || withoutExt
      : withoutExt;

    const safeDuration = duration > 0 ? duration : 30;
    const track: Track = {
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      artist,
      album: 'Unknown Album',
      filePath,
      startTime: 0,
      endTime: safeDuration,
      duration: safeDuration,
    };

    const updatedCatalog: NamedCatalog = {
      ...active,
      tracks: [...active.tracks, track],
    };
    const nextCatalogs = state.catalogs.map((c) => (c.id === active.id ? updatedCatalog : c));
    writeState({ ...state, catalogs: nextCatalogs });
    return Promise.resolve(track);
  },

  updateCrop(id: string, startTime: number, endTime: number): Promise<Track | null> {
    const state = readState();
    const active = getActiveCatalog(state);
    const idx = active.tracks.findIndex((t) => t.id === id);
    if (idx === -1) return Promise.resolve(null);

    const target = active.tracks[idx];
    if (
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      startTime < 0 ||
      endTime <= startTime ||
      endTime > target.duration
    ) {
      return Promise.resolve(null);
    }

    const updated: Track = { ...target, startTime, endTime };
    const nextTracks = [...active.tracks];
    nextTracks[idx] = updated;
    const updatedCatalog: NamedCatalog = { ...active, tracks: nextTracks };
    const nextCatalogs = state.catalogs.map((c) => (c.id === active.id ? updatedCatalog : c));
    writeState({ ...state, catalogs: nextCatalogs });
    return Promise.resolve(updated);
  },

  remove(id: string): Promise<boolean> {
    const state = readState();
    const active = getActiveCatalog(state);
    const filtered = active.tracks.filter((t) => t.id !== id);
    if (filtered.length === active.tracks.length) return Promise.resolve(false);
    const updatedCatalog: NamedCatalog = { ...active, tracks: filtered };
    const nextCatalogs = state.catalogs.map((c) => (c.id === active.id ? updatedCatalog : c));
    writeState({ ...state, catalogs: nextCatalogs });
    return Promise.resolve(true);
  },
};