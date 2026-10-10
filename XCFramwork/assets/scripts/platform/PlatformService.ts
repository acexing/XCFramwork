import { sys } from 'cc';
import { DEBUG } from 'cc/env';
import { IPlatformService } from '../core/interfaces/IPlatformService';
import {
  IPlatformAdapter,
  IStorageAdapter,
  PlatformCapabilities,
} from '../core/interfaces/IPlatformAdapter';
import { DesktopAdapter } from './DesktopAdapter';
import { AndroidAdapter } from './AndroidAdapter';

export type PlatformType = 'desktop' | 'android' | 'steam';

export class PlatformService implements IPlatformService {
  private adapter: IPlatformAdapter;
  private capabilities: PlatformCapabilities;
  private platformType: PlatformType;

  constructor() {
    this.platformType = this.detectPlatform();
    this.adapter = this.createAdapter(this.platformType);
    this.capabilities = this.adapter.getCapabilities();
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

  private detectPlatform(): PlatformType {
    const platform = sys.platform;
    if (platform === sys.Platform.ANDROID) {
      return 'android';
    }
    if (platform === sys.Platform.WIN32 || platform === sys.Platform.MACOS) {
      if (DEBUG) {
        console.log(`[PlatformService] 检测到平台: ${platform}`);
      }
      return 'desktop';
    }
    if (DEBUG) {
      console.log(`[PlatformService] 未知平台: ${platform}，回退为 desktop`);
    }
    return 'desktop';
  }

  private createAdapter(type: PlatformType): IPlatformAdapter {
    switch (type) {
      case 'android':
        return new AndroidAdapter();
      case 'desktop':
      case 'steam':
      default:
        return new DesktopAdapter();
    }
  }
}
