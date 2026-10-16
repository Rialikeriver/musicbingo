import path from 'path';
import fs from 'fs';

export class AssetManager {
  private assetPaths: Map<string, string> = new Map();
  private defaultAssetsDir: string;

  constructor(baseDir: string) {
    this.defaultAssetsDir = path.join(baseDir, 'defaults');
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    // Map default fallback paths
    this.assetPaths.set('winnerAudio', path.join(this.defaultAssetsDir, 'audio', 'winner_default.mp3'));
    this.assetPaths.set('winnerVideo', path.join(this.defaultAssetsDir, 'video', 'winner_default.mp4'));
    this.assetPaths.set('noBingoImage', path.join(this.defaultAssetsDir, 'img', 'nobingo_default.png'));
  }

  public mapAssetPath(key: string, absolutePath: string): void {
    if (fs.existsSync(absolutePath)) {
      this.assetPaths.set(key, absolutePath);
    } else {
      throw new Error(`Asset path does not exist: ${absolutePath}`);
    }
  }

  public getAssetPath(key: string): string {
    return this.assetPaths.get(key) || this.assetPaths.get('noBingoImage')!;
  }
}
