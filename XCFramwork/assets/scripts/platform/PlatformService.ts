import { sys } from 'cc';
import { DEBUG } from 'cc/env';
import { IPlatformService } from '../core/interfaces/IPlatformService';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { IHotUpdateAdapter } from '../core/interfaces/IHotUpdateAdapter';
import { DesktopAdapter } from './DesktopAdapter';
import { AndroidAdapter } from './AndroidAdapter';
import { SteamAdapter } from './SteamAdapter';
import { WebHotUpdateAdapter } from './WebHotUpdateAdapter';
import { SteamHotUpdateAdapter } from './SteamHotUpdateAdapter';
import { DesktopHotUpdateAdapter } from './DesktopHotUpdateAdapter';
import { AndroidHotUpdateAdapter } from './AndroidHotUpdateAdapter';

export type PlatformType = 'desktop' | 'android' | 'steam';

const STEAM_ENV_KEY = 'STEAM';
const LOGGER_TAG = 'PlatformService';

export class PlatformService implements IPlatformService {
  private adapter: IPlatformAdapter;
  private capabilities: PlatformCapabilities;
  private platformType: PlatformType;
  private hotUpdateAdapter: IHotUpdateAdapter;

  constructor() {
    this.platformType = this.detectPlatform();
    this.adapter = this.createAdapter(this.platformType);
    this.capabilities = this.adapter.getCapabilities();
    this.hotUpdateAdapter = this.createHotUpdateAdapter(this.platformType);
  }

  getPlatformName(): string {
    return this.adapter.getPlatformName();
  }

  getCapabilities(): PlatformCapabilities {
    return this.capabilities;
  }

  quitGame(): Promise<void> {
    return this.adapter.quitGame();
  }

  openExternalUrl(url: string): Promise<void> {
    return this.adapter.openExternalUrl(url);
  }

  vibrate(duration: number): Promise<void> {
    return this.adapter.vibrate(duration);
  }

  getStorageAdapter(): IStorageAdapter {
    return this.adapter.getStorageAdapter();
  }

  getHotUpdateAdapter(): IHotUpdateAdapter {
    return this.hotUpdateAdapter;
  }

  unlockAchievement(achievementId: string): Promise<void> {
    return this.adapter.unlockAchievement(achievementId);
  }

  setStat(statName: string, value: number): Promise<void> {
    return this.adapter.setStat(statName, value);
  }

  getStat(statName: string): Promise<number> {
    return this.adapter.getStat(statName);
  }

  isCloudSaveEnabled(): boolean {
    return this.adapter.isCloudSaveEnabled();
  }

  getBackKeyHandler(): (() => boolean) | null {
    return this.adapter.getBackKeyHandler();
  }

  shareContent(title: string, content: string): Promise<void> {
    return this.adapter.shareContent(title, content);
  }

  private detectPlatform(): PlatformType {
    const platform = sys.platform;
    if (platform === sys.Platform.ANDROID) {
      return 'android';
    }
    if (platform === sys.Platform.WIN32 || platform === sys.Platform.MACOS) {
      if (this.isSteamVersion()) {
        return 'steam';
      }
      return 'desktop';
    }
    if (DEBUG) {
      console.log(`[${LOGGER_TAG}] 未知平台: ${platform}，回退为 desktop`);
    }
    return 'desktop';
  }

  private isSteamVersion(): boolean {
    try {
      const globalObj =
        typeof globalThis !== 'undefined'
          ? globalThis
          : typeof window !== 'undefined'
            ? window
            : undefined;
      if (globalObj) {
        const env = (globalObj as Record<string, unknown>).process;
        if (env && typeof env === 'object') {
          const envObj = (env as Record<string, Record<string, unknown>>).env;
          if (envObj && envObj[STEAM_ENV_KEY] !== undefined) {
            return true;
          }
        }
      }
    } catch {
      // process 不可用
    }
    return false;
  }

  private createAdapter(type: PlatformType): IPlatformAdapter {
    switch (type) {
      case 'android':
        return new AndroidAdapter();
      case 'steam':
        return new SteamAdapter();
      case 'desktop':
      default:
        return new DesktopAdapter();
    }
  }

  private createHotUpdateAdapter(type: PlatformType): IHotUpdateAdapter {
    switch (type) {
      case 'android':
        return new AndroidHotUpdateAdapter();
      case 'steam':
        return new SteamHotUpdateAdapter();
      case 'desktop':
      default:
        return new DesktopHotUpdateAdapter();
    }
  }
}
