import { game, sys } from 'cc';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';

export class AndroidAdapter implements IPlatformAdapter {
  private storageAdapter: IStorageAdapter;

  constructor() {
    this.storageAdapter = new LocalStorageAdapter();
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

  vibrate(_duration: number): Promise<void> {
    return Promise.resolve();
  }

  getStorageAdapter(): IStorageAdapter {
    return this.storageAdapter;
  }
}
