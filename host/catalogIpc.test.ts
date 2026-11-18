// Checks that the channel names written into preload.ts match CATALOG_CHANNELS.
// preload.ts cannot import them (Electron's sandbox forbids it), so this test keeps them in step.
// Run it from the project root, so process.cwd() points at the project folder.
import * as assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CATALOG_CHANNELS } from './catalogIpc';

const preloadSource = fs.readFileSync(path.join(process.cwd(), 'host', 'preload.ts'), 'utf-8');

for (const channel of Object.values(CATALOG_CHANNELS)) {
  assert.ok(preloadSource.includes(`'${channel}'`), `preload.ts is missing channel ${channel}`);
}
assert.ok(!preloadSource.includes("from './catalogIpc'"), 'preload.ts must not import project files');

console.log('catalogIpc: all tests passed');
