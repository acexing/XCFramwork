import { JsonAsset, Prefab, SpriteFrame, AudioClip, Asset } from 'cc';

export interface BundleDetail {
  name: string;
  assetCount: number;
  loadTime: number;
}

export interface AssetStats {
  loadedBundles: string[];
  totalAssets: number;
  bundleDetails: BundleDetail[];
}

export interface IAssetService {
  loadBundle(name: string): Promise<void>;
  loadPrefab(bundleName: string, path: string): Promise<Prefab>;
  loadSpriteFrame(bundleName: string, path: string): Promise<SpriteFrame>;
  loadAudioClip(bundleName: string, path: string): Promise<AudioClip>;
  loadJson(bundleName: string, path: string): Promise<JsonAsset>;
  preloadGroup(
    bundleName: string,
    paths: string[],
    onProgress?: (cur: number, total: number) => void
  ): Promise<void>;
  releaseBundle(bundleName: string): void;
  releaseAsset(bundleName: string, path: string): void;
  isBundleLoaded(bundleName: string): boolean;
  getStats(): AssetStats;
}

export type AssetType =
  typeof Prefab | typeof JsonAsset | typeof SpriteFrame | typeof AudioClip | typeof Asset;
