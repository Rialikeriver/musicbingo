# Changes: catalog work (Harpreet, branch `happybingo`)

Every change made in this branch, what it does, and why.

## 1. Merge of `origin/main` into `happybingo`
- **What:** brought in the `GIT_WORKFLOW.md` guide and the team's starter files.
- **Why:** the workflow says to merge `main` into your branch before merging back, so conflicts show up early.

## 2. Merge of `control-panel_chaitanya` into `happybingo`
- **What:** brought in the TypeScript host setup (`host/main.ts`, `preload.ts`, `settings.ts`), the Control Panel renderer, and the merged `Track` type with `endTime` and `previewUrl`.
- **Conflict resolved:** `package.json`. I kept the Control Panel version (`"main": "dist/main.js"`, `"dev": "tsc && electron ."`).
- **Removed:** `host/main.js`, my temporary placeholder. It would have run a second, conflicting Electron entry point next to `main.ts`.
- **Why:** the Control Panel branch is the most advanced host code. Your `DataLookup` type expects the merged `Track` type, which has `endTime`. Keeping `main.js` would have broken the app's startup.
- **Not pushed to `main`.** This merge only changes `happybingo`.

## 3. `host/DataLookup.ts`: new method `all()`
- **What:** returns every stored track as an array.
- **Why:** the catalog store and the catalog list need to read the whole catalog, for example when saving it to disk.

## 4. `host/DataLookup.test.ts`: two changes
- **What:**
  - The `makeTrack` helper now sets `endTime`, because the merged `Track` type requires it.
  - Added a test for `all()`.
- **Why:** without `endTime`, the test file would not compile after the merge.

## 5. `host/TrackParser.ts`: new file
- **What:** `parseTrackName(fileNameOrPath)` returns `{ artist, title }` from a name like `Queen - Bohemian Rhapsody.mp3`.
- **Rules:**
  - Folders are ignored; only the file name is used.
  - The extension is removed.
  - The name splits at the first ` - `, so `Artist - Title - Remix` gives title `Title - Remix`.
  - Quotes and brackets are kept exactly.
  - No separator, or a separator with nothing on one side, gives artist `Unknown Artist`.
- **Why:** the attachment requires files named "Artist - Title" to import without manual renaming, including quotes and brackets. The current import code sets every artist to `Unknown Artist`.
- **Not included yet:** reading ID3 tags from the MP3 metadata. That needs an extra library and will come later.

## 6. `host/TrackParser.test.ts`: new file
- **What:** tests the rules above, including full paths, quotes, brackets, missing separators, and extra spaces.

## 7. `host/stableId.ts`: new file
- **What:** `stableTrackId(filePath)` returns a 16-character ID made from the file path.
- **Why:** the current import code uses `Date.now()` and `Math.random()`, so importing the same file twice creates two tracks, and IDs change every run. A path-based ID is the same every time, so duplicates can be detected.
- **Detail:** the path is normalised first (forward slashes, lower case), so `C:\Music\A.mp3` and `c:/music/a.mp3` give the same ID on Windows.
- **Limit:** on macOS, paths are case-sensitive, so this lower-casing could merge two files whose names differ only by case. Revisit this if macOS is added.

## 8. `host/stableId.test.ts`: new file
- **What:** tests that the same path gives the same ID, that slashes and case don't matter, that different files give different IDs, and that the ID is 16 hex characters.

## 9. `host/CHANGES.md`: this file.

## How the tests were run
```
cd host
tsc DataLookup.test.ts TrackParser.test.ts stableId.test.ts DataLookup.ts TrackParser.ts stableId.ts index.ts --outDir build --target es2020 --module commonjs --lib es2020,dom --strict --types node
cd build
node DataLookup.test.js
node TrackParser.test.js
node stableId.test.js
```
All three print `all tests passed`.

## Not done yet
- `CatalogStore` (saving the catalog to disk): needs the storage decision from the team.
- Connecting import and playback to the catalog: needs agreement from the import and playback owners.
- ID3 metadata reading: needs an extra library.
- Full-project type check with Electron installed: the clone has no `node_modules`, so only the catalog files were checked.
