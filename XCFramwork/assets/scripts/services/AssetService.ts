import {
  AudioClip,
  JsonAsset,
  Prefab,
  SpriteFrame,
  Asset,
  assetManager,
  resources,
  AssetManager,
  Constructor,
} from 'cc';
import { AssetStats, IAssetService } from '../core/interfaces/IAssetService';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'AssetService';

export class AssetService implements IAssetService {
  private logger: ILogger;
  private loadedBundles = new Map<string, AssetManager.Bundle>();
  private loadingBundles = new Map<string, Promise<void>>();
  private assetCache = new Map<string, Asset>();
  private refCounts = new Map<string, number>();
  private bundleLoadTimes = new Map<string, number>();

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async loadBundle(name: string): Promise<void> {
    if (name === 'resources' || this.loadedBundles.has(name)) {
      return;
    }
    const pending = this.loadingBundles.get(name);
    if (pending) {
      return pending;
    }
    const loadPromise = new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      assetManager.loadBundle(name, (error, bundle) => {
        if (error) {
          this.logger.error(LOGGER_TAG, `Bundle 加载失败: ${name}`, error);
          reject(error);
          return;
        }
        this.loadedBundles.set(name, bundle);
        this.bundleLoadTimes.set(name, Date.now() - startTime);
        this.logger.info(LOGGER_TAG, `Bundle 加载完成: ${name}`);
        resolve();
      });
    });
    this.loadingBundles.set(name, loadPromise);
    try {
      await loadPromise;
    } finally {
      this.loadingBundles.delete(name);
    }
  }

  loadPrefab(bundleName: string, path: string): Promise<Prefab> {
    return this.loadAsset(bundleName, path, Prefab);
  }

  loadSpriteFrame(bundleName: string, path: string): Promise<SpriteFrame> {
    return this.loadAsset(bundleName, `${path}/spriteFrame`, SpriteFrame);
  }

  loadAudioClip(bundleName: string, path: string): Promise<AudioClip> {
    return this.loadAsset(bundleName, path, AudioClip);
  }

  loadJson(bundleName: string, path: string): Promise<JsonAsset> {
    return this.loadAsset(bundleName, path, JsonAsset);
  }

  async preloadGroup(
    bundleName: string,
    paths: string[],
    onProgress?: (cur: number, total: number) => void
  ): Promise<void> {
    for (let i = 0; i < paths.length; i++) {
      await this.loadBundle(bundleName);
      await this.loadJson(bundleName, paths[i]).catch(() => undefined);
      onProgress?.(i + 1, paths.length);
    }
  }

  releaseBundle(bundleName: string): void {
    const bundle = this.loadedBundles.get(bundleName);
    if (!bundle) {
      this.logger.debug(LOGGER_TAG, `释放 Bundle，未加载: ${bundleName}`);
      return;
    }
    for (const key of Array.from(this.assetCache.keys())) {
      if (key.startsWith(`${bundleName}:`)) {
        this.assetCache.delete(key);
        this.refCounts.delete(key);
      }
    }
    bundle.releaseAll();
    this.loadedBundles.delete(bundleName);
    this.bundleLoadTimes.delete(bundleName);
    this.logger.info(LOGGER_TAG, `Bundle 已释放: ${bundleName}`);
  }

  releaseAsset(bundleName: string, path: string): void {
    const key = this.buildKey(bundleName, path);
    const count = (this.refCounts.get(key) ?? 0) - 1;
    if (count > 0) {
      this.refCounts.set(key, count);
      return;
    }
    const asset = this.assetCache.get(key);
    if (asset) {
      asset.decRef();
      this.assetCache.delete(key);
      this.refCounts.delete(key);
    }
  }

  isBundleLoaded(bundleName: string): boolean {
    return bundleName === 'resources' || this.loadedBundles.has(bundleName);
  }

  getStats(): AssetStats {
    const bundleDetails = Array.from(this.loadedBundles.keys()).map((name) => ({
      name,
      assetCount: Array.from(this.assetCache.keys()).filter((key) => key.startsWith(`${name}:`))
        .length,
      loadTime: this.bundleLoadTimes.get(name) ?? 0,
    }));
    bundleDetails.push({
      name: 'resources',
      assetCount: Array.from(this.assetCache.keys()).filter((key) => key.startsWith('resources:'))
        .length,
      loadTime: 0,
    });
    return {
      loadedBundles: Array.from(this.loadedBundles.keys()),
      totalAssets: this.assetCache.size,
      bundleDetails,
    };
  }

  private buildKey(bundleName: string, path: string): string {
    return `${bundleName}:${path}`;
  }

  private loadAsset<T extends Asset>(
    bundleName: string,
    path: string,
    type: Constructor<T>
  ): Promise<T> {
    const key = this.buildKey(bundleName, path);
    const cached = this.assetCache.get(key);
    if (cached instanceof type) {
      this.refCounts.set(key, (this.refCounts.get(key) ?? 0) + 1);
      return Promise.resolve(cached as T);
    }
    return new Promise<T>((resolve, reject) => {
      const startTime = Date.now();
      const onComplete = (error: Error | null, asset: unknown) => {
        if (error || !asset) {
          this.logger.error(LOGGER_TAG, `资源加载失败: ${key}`, error ?? new Error('资源为空'));
          reject(error ?? new Error(`资源加载失败: ${key}`));
          return;
        }
        if (!(asset instanceof type)) {
          reject(new Error(`资源类型不匹配: ${key}`));
          return;
        }
        asset.addRef();
        this.assetCache.set(key, asset);
        this.refCounts.set(key, 1);
        this.logger.debug(LOGGER_TAG, `资源加载完成: ${key} 耗时${Date.now() - startTime}ms`);
        resolve(asset);
      };
      if (bundleName === 'resources') {
        resources.load(path, onComplete as never);
        return;
      }
      const bundle = this.loadedBundles.get(bundleName);
      if (!bundle) {
        this.loadBundle(bundleName)
          .then(() => {
            const loaded = this.loadedBundles.get(bundleName);
            if (!loaded) {
              reject(new Error(`Bundle 不可用: ${bundleName}`));
              return;
            }
            loaded.load(path, onComplete as never);
          })
          .catch(reject);
        return;
      }
      bundle.load(path, onComplete as never);
    });
  }
}
