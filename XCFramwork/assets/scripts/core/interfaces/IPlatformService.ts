import { IStorageAdapter, PlatformCapabilities } from './IPlatformAdapter';
import { IHotUpdateAdapter } from './IHotUpdateAdapter';

export interface IPlatformService {
  getPlatformName(): string;
  getCapabilities(): PlatformCapabilities;
  quitGame(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  vibrate(duration: number): Promise<void>;
  getStorageAdapter(): IStorageAdapter;
  getHotUpdateAdapter(): IHotUpdateAdapter;
  unlockAchievement(achievementId: string): Promise<void>;
  setStat(statName: string, value: number): Promise<void>;
  getStat(statName: string): Promise<number>;
  isCloudSaveEnabled(): boolean;
  getBackKeyHandler(): (() => boolean) | null;
  shareContent(title: string, content: string): Promise<void>;
}
