// Tests for CatalogStore and the IPC wiring. Run them with the steps in CHANGES.md.
import * as assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CatalogStore } from './CatalogStore';
import { CATALOG_CHANNELS, registerCatalogHandlers } from './catalogIpc';

// Each test uses its own temporary folder, so no real files are touched.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
const file = path.join(dir, 'catalog.json');

// No file yet: starts empty
let store = new CatalogStore(file);
store.load();
assert.strictEqual(store.list().length, 0);

// Import parses the name, saves to disk and returns the track
const first = store.importFile('C:/music/Queen - Bohemian Rhapsody.mp3', 354);
assert.ok(first);
assert.strictEqual(first!.artist, 'Queen');
assert.strictEqual(first!.title, 'Bohemian Rhapsody');
assert.strictEqual(first!.duration, 354);
assert.strictEqual(first!.endTime, 354);
assert.strictEqual(first!.album, 'Unknown Album');
assert.ok(fs.existsSync(file), 'catalog file is written');

// Importing the same file again is rejected and does not add a second copy
assert.strictEqual(store.importFile('c:\\MUSIC\\queen - bohemian rhapsody.mp3', 354), null);
assert.strictEqual(store.list().length, 1);

// Unknown duration falls back to 30 seconds
const noLength = store.importFile('C:/music/Artist - Song.mp4', 0);
assert.strictEqual(noLength!.duration, 30);
assert.strictEqual(noLength!.artist, 'Artist');

// A new store reading the same file sees the same tracks
const reloaded = new CatalogStore(file);
reloaded.load();
assert.deepStrictEqual(reloaded.list().map(t => t.id).sort(), store.list().map(t => t.id).sort());

// Remove saves the change to disk
assert.strictEqual(store.remove(first!.id), true);
assert.strictEqual(store.remove(first!.id), false);
const afterRemove = new CatalogStore(file);
afterRemove.load();
assert.strictEqual(afterRemove.list().length, 1);

// A damaged file is kept as .bak and the catalog starts empty
fs.writeFileSync(file, '{ this is not json', 'utf-8');
const broken = new CatalogStore(file);
broken.load();
assert.strictEqual(broken.list().length, 0);
assert.ok(fs.existsSync(`${file}.bak`), 'damaged file is kept as .bak');

// Crop: valid crop is saved and survives a reload; invalid crops are rejected
const cropStore = new CatalogStore(path.join(dir, 'crop.json'));
cropStore.load();
const song = cropStore.importFile('C:/music/Band - Crop Me.mp3', 240)!;
const cropped = cropStore.updateCrop(song.id, 10, 90);
assert.strictEqual(cropped!.startTime, 10);
assert.strictEqual(cropped!.endTime, 90);
assert.strictEqual(cropped!.duration, 240, 'duration is not changed by a crop');
assert.strictEqual(cropStore.updateCrop(song.id, 50, 50), null, 'end must be after start');
assert.strictEqual(cropStore.updateCrop(song.id, -1, 20), null, 'start must not be negative');
assert.strictEqual(cropStore.updateCrop('unknown-id', 0, 10), null, 'unknown id');
const cropReloaded = new CatalogStore(path.join(dir, 'crop.json'));
cropReloaded.load();
assert.strictEqual(cropReloaded.list()[0].startTime, 10);
assert.strictEqual(cropReloaded.list()[0].endTime, 90);

// IPC wiring: the four channels are registered and call the store
const handlers = new Map<string, (...args: any[]) => unknown>();
const fakeIpc = { handle: (channel: string, listener: (...args: any[]) => unknown) => { handlers.set(channel, listener); } };
const ipcStore = new CatalogStore(path.join(dir, 'ipc.json'));
ipcStore.load();
registerCatalogHandlers(fakeIpc, ipcStore);
assert.deepStrictEqual([...handlers.keys()].sort(),
  [CATALOG_CHANNELS.import, CATALOG_CHANNELS.list, CATALOG_CHANNELS.remove, CATALOG_CHANNELS.updateCrop].sort());

const added = handlers.get(CATALOG_CHANNELS.import)!('C:/music/Band - Live Song.mp3', 200) as { id: string };
assert.ok(added && added.id);
assert.strictEqual((handlers.get(CATALOG_CHANNELS.list)!() as unknown[]).length, 1);
const ipcCrop = handlers.get(CATALOG_CHANNELS.updateCrop)!(added.id, 5, 60) as { startTime: number };
assert.strictEqual(ipcCrop.startTime, 5);
assert.strictEqual(handlers.get(CATALOG_CHANNELS.remove)!(added.id), true);
assert.strictEqual((handlers.get(CATALOG_CHANNELS.list)!() as unknown[]).length, 0);

fs.rmSync(dir, { recursive: true, force: true });
console.log('CatalogStore: all tests passed');
