# DataLookup

Stores tracks by `id` and returns their file address (`filePath`).
TypeScript has no pointers, so code asks for a track by its id.

File: `host/DataLookup.ts`
Uses the `Track` type from `host/index.ts`.

## API

| Method | Returns | Notes |
|---|---|---|
| `add(track: Track)` | `void` | Throws if the id already exists. |
| `has(id: string)` | `boolean` | True if the id is stored. |
| `getTrack(id: string)` | `Track \| undefined` | Full track object. |
| `getAddress(id: string)` | `string \| undefined` | The track's `filePath`. |
| `remove(id: string)` | `boolean` | True if a track was removed. |
| `size()` | `number` | Number of stored tracks. |

## Example

```ts
import { DataLookup } from './DataLookup';

const lookup = new DataLookup();
lookup.add({
  id: 't1',
  title: 'Song',
  artist: 'Artist',
  album: 'Album',
  filePath: 'C:/music/song.mp3',
  startTime: 0,
  duration: 200,
});

lookup.getAddress('t1');      // 'C:/music/song.mp3'
lookup.getAddress('missing'); // undefined
```

## Running the tests

From the project root:

```
npx tsc host/DataLookup.test.ts host/DataLookup.ts host/index.ts --outDir build --target es2020 --module commonjs --lib es2020,dom --strict
node build/DataLookup.test.js
```

Expected output: `DataLookup: all tests passed`
