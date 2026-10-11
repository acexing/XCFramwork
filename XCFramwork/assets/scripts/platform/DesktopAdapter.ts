import { game } from 'cc';
import { DEBUG } from 'cc/env';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { DesktopStorageAdapter } from './DesktopStorageAdapter';

const LOGGER_TAG = 'DesktopAdapter';

export class DesktopAdapter implements IPlatformAdapter {
  private storageAdapter: IStorageAdapter;

  constructor() {
    this.storageAdapter = new DesktopStorageAdapter();
  }

  getPlatformName(): string {
    return 'desktop';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      cloudSave: false,
      achievements: false,
      overlay: false,
      haptics: false,
      externalLink: true,
      share: false,
      vibration: false,
    };
  }

  quitGame(): Promise<void> {
    return new Promise((resolve) => {
      if (DEBUG) {
        console.warn(`[${LOGGER_TAG}] 开发环境不执行退出`);
        resolve();
        return;
      }
      game.end();
      resolve();
    });
  }

  openExternalUrl(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
      resolve();
    });
  }

  vibrate(_duration: number): Promise<void> {
    return Promise.resolve();
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
    return null;
  }

  shareContent(_title: string, _content: string): Promise<void> {
    return Promise.resolve();
  }
}
