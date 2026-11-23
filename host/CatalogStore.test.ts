// Tests for CatalogStore, the IPC wiring and tag reading.
import * as assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CatalogStore } from './CatalogStore';
import { CATALOG_CHANNELS, registerCatalogHandlers } from './catalogIpc';

// Builds a minimal MP3 file with ID3v2.3 artist and title tags.
function syncSafe(n: number): Buffer {
  return Buffer.from([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
}
function textFrame(id: string, text: string): Buffer {
  const body = Buffer.concat([Buffer.from([0x00]), Buffer.from(text, 'latin1')]); // encoding byte 0 = ISO-8859-1
  const size = Buffer.alloc(4);
  size.writeUInt32BE(body.length);
  return Buffer.concat([Buffer.from(id, 'latin1'), size, Buffer.from([0, 0]), body]);
}
function taggedMp3(artist: string, title: string): Buffer {
  const tags = Buffer.concat([textFrame('TPE1', artist), textFrame('TIT2', title)]);
  const header = Buffer.concat([Buffer.from('ID3', 'latin1'), Buffer.from([3, 0, 0]), syncSafe(tags.length)]);
  const audioFrame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x00]), Buffer.alloc(413)]); // one MPEG frame
  return Buffer.concat([header, tags, audioFrame, audioFrame, audioFrame]);
}

async function main(): Promise<void> {
  // Each run uses its own temporary folder, so no real files are touched.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
  const file = path.join(dir, 'catalog.json');

  // No file yet: starts empty
  const store = new CatalogStore(file);
  store.load();
  assert.strictEqual(store.list().length, 0);

  // Import parses the name (file does not exist, so no tags), saves to disk and returns the track
  const first = await store.importFile('C:/music/Queen - Bohemian Rhapsody.mp3', 354);
  assert.ok(first);
  assert.strictEqual(first!.artist, 'Queen');
  assert.strictEqual(first!.title, 'Bohemian Rhapsody');
  assert.strictEqual(first!.duration, 354);
  assert.strictEqual(first!.endTime, 354);
  assert.strictEqual(first!.album, 'Unknown Album');
  assert.ok(fs.existsSync(file), 'catalog file is written');

  // Importing the same file again is rejected and does not add a second copy
  assert.strictEqual(await store.importFile('c:\\MUSIC\\queen - bohemian rhapsody.mp3', 354), null);
  assert.strictEqual(store.list().length, 1);

  // Unknown duration falls back to 30 seconds
  const noLength = await store.importFile('C:/music/Artist - Song.mp4', 0);
  assert.strictEqual(noLength!.duration, 30);
  assert.strictEqual(noLength!.artist, 'Artist');

  // Tags win over the file name when the file has them
  const tagPath = path.join(dir, 'Wrong Name - Also Wrong.mp3');
  fs.writeFileSync(tagPath, taggedMp3('Real Artist', 'Real Title'));
  const tagged = await store.importFile(tagPath, 0);
  assert.strictEqual(tagged!.artist, 'Real Artist');
  assert.strictEqual(tagged!.title, 'Real Title');

  // Playback lookup: id -> file path, unknown id -> undefined
  assert.strictEqual(store.getAddress(first!.id), 'C:/music/Queen - Bohemian Rhapsody.mp3');
  assert.strictEqual(store.getAddress('missing'), undefined);

  // A new store reading the same file sees the same tracks
  const reloaded = new CatalogStore(file);
  reloaded.load();
  assert.deepStrictEqual(reloaded.list().map(t => t.id).sort(), store.list().map(t => t.id).sort());

  // Remove saves the change to disk
  assert.strictEqual(store.remove(first!.id), true);
  assert.strictEqual(store.remove(first!.id), false);
  const afterRemove = new CatalogStore(file);
  afterRemove.load();
  assert.strictEqual(afterRemove.list().length, 2);

  // A damaged file is kept as .bak and the catalog starts empty
  fs.writeFileSync(file, '{ this is not json', 'utf-8');
  const broken = new CatalogStore(file);
  broken.load();
  assert.strictEqual(broken.list().length, 0);
  assert.ok(fs.existsSync(`${file}.bak`), 'damaged file is kept as .bak');

  // Crop: valid crop is saved and survives a reload; invalid crops are rejected
  const cropStore = new CatalogStore(path.join(dir, 'crop.json'));
  cropStore.load();
  const song = (await cropStore.importFile('C:/music/Band - Crop Me.mp3', 240))!;
  const cropped = cropStore.updateCrop(song.id, 10, 90);
  assert.strictEqual(cropped!.startTime, 10);
  assert.strictEqual(cropped!.endTime, 90);
  assert.strictEqual(cropped!.duration, 240, 'duration is not changed by a crop');
  assert.strictEqual(cropStore.updateCrop(song.id, 50, 50), null, 'end must be after start');
  assert.strictEqual(cropStore.updateCrop(song.id, 10, 300), null, 'end must not pass the song length');
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

  const added = (await handlers.get(CATALOG_CHANNELS.import)!('C:/music/Band - Live Song.mp3', 200)) as { id: string };
  assert.ok(added && added.id);
  assert.strictEqual((handlers.get(CATALOG_CHANNELS.list)!() as unknown[]).length, 1);
  const ipcCrop = (await handlers.get(CATALOG_CHANNELS.updateCrop)!(added.id, 5, 60)) as { startTime: number };
  assert.strictEqual(ipcCrop.startTime, 5);
  assert.strictEqual(handlers.get(CATALOG_CHANNELS.remove)!(added.id), true);
  assert.strictEqual((handlers.get(CATALOG_CHANNELS.list)!() as unknown[]).length, 0);

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('CatalogStore: all tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
