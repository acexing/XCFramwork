import { game } from 'cc';
import { DEBUG } from 'cc/env';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { DesktopStorageAdapter } from './DesktopStorageAdapter';

const LOGGER_TAG = 'SteamAdapter';

export class SteamAdapter implements IPlatformAdapter {
  private storageAdapter: IStorageAdapter;
  private steamAvailable: boolean = false;

  constructor() {
    this.storageAdapter = new DesktopStorageAdapter();
    this.steamAvailable = this.checkSteamAvailable();
  }

  getPlatformName(): string {
    return 'steam';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      cloudSave: this.steamAvailable,
      achievements: this.steamAvailable,
      overlay: this.steamAvailable,
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

  unlockAchievement(achievementId: string): Promise<void> {
    if (!this.steamAvailable) {
      if (DEBUG) {
        console.log(`[${LOGGER_TAG}] Steam 未就绪，忽略成就解锁: ${achievementId}`);
      }
      return Promise.resolve();
    }
    if (DEBUG) {
      console.log(`[${LOGGER_TAG}] 解锁成就: ${achievementId}`);
    }
    return Promise.resolve();
  }

  setStat(statName: string, value: number): Promise<void> {
    if (!this.steamAvailable) {
      return Promise.resolve();
    }
    if (DEBUG) {
      console.log(`[${LOGGER_TAG}] 设置统计: ${statName} = ${value}`);
    }
    return Promise.resolve();
  }

  getStat(statName: string): Promise<number> {
    if (!this.steamAvailable) {
      return Promise.resolve(0);
    }
    if (DEBUG) {
      console.log(`[${LOGGER_TAG}] 获取统计: ${statName}`);
    }
    return Promise.resolve(0);
  }

  isCloudSaveEnabled(): boolean {
    return this.steamAvailable;
  }

  getBackKeyHandler(): (() => boolean) | null {
    return null;
  }

  shareContent(_title: string, _content: string): Promise<void> {
    return Promise.resolve();
  }

  private checkSteamAvailable(): boolean {
    if (DEBUG) {
      console.log(`[${LOGGER_TAG}] Steam SDK 桥接尚未接入，降级为无 Steam 功能`);
      return false;
    }
    return false;
  }
}
