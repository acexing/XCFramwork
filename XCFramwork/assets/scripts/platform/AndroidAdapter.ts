import { game, sys } from 'cc';
import { DEBUG } from 'cc/env';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { AndroidStorageAdapter } from './AndroidStorageAdapter';

const LOGGER_TAG = 'AndroidAdapter';

export class AndroidAdapter implements IPlatformAdapter {
  private storageAdapter: IStorageAdapter;
  private backKeyHandler: (() => boolean) | null = null;

  constructor() {
    this.storageAdapter = new AndroidStorageAdapter();
    this.setupBackKeyHandler();
  }

  getPlatformName(): string {
    return 'android';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      cloudSave: false,
      achievements: false,
      overlay: false,
      haptics: true,
      externalLink: true,
      share: true,
      vibration: true,
    };
  }

  quitGame(): Promise<void> {
    return new Promise((resolve) => {
      game.end();
      resolve();
    });
  }

  openExternalUrl(url: string): Promise<void> {
    return new Promise((resolve) => {
      sys.openURL(url);
      resolve();
    });
  }

  vibrate(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const nativeModule = this.getNativeBridge();
      if (nativeModule && typeof nativeModule.vibrate === 'function') {
        nativeModule.vibrate(duration);
      }
      resolve();
    });
  }

  getStorageAdapter(): IStorageAdapter {
    return this.storageAdapter;
  }

  unlockAchievement(_achievementId: string): Promise<void> {
    return Promise.resolve();
  }

  setStat(_statName: string, _value: number): Promise<void> {
    return Promise.resolve();
  }

  getStat(_statName: string): Promise<number> {
    return Promise.resolve(0);
  }

  isCloudSaveEnabled(): boolean {
    return false;
  }

  getBackKeyHandler(): (() => boolean) | null {
    return this.backKeyHandler;
  }

  shareContent(title: string, content: string): Promise<void> {
    return new Promise((resolve) => {
      const nativeModule = this.getNativeBridge();
      if (nativeModule && typeof nativeModule.shareContent === 'function') {
        nativeModule.shareContent(title, content);
      }
      if (DEBUG) {
        console.log(`[${LOGGER_TAG}] 分享内容: ${title}`);
      }
      resolve();
    });
  }

  private setupBackKeyHandler(): void {
    this.backKeyHandler = () => {
      if (DEBUG) {
        console.log(`[${LOGGER_TAG}] 返回键按下`);
      }
      return false;
    };
  }

  private getNativeBridge(): Record<string, unknown> | null {
    try {
      const nativeModule = (cc as unknown as Record<string, unknown>).native;
      if (nativeModule && typeof nativeModule === 'object') {
        const bridge = (nativeModule as Record<string, unknown>).bridge;
        if (bridge && typeof bridge === 'object') {
          return bridge as Record<string, unknown>;
        }
      }
    } catch {
      // native 不可用
    }
    return null;
  }
}
