import type { IStorageAdapter } from './IStorageAdapter';

export type { IStorageAdapter };

export interface PlatformCapabilities {
  cloudSave: boolean;
  achievements: boolean;
  overlay: boolean;
  haptics: boolean;
  externalLink: boolean;
  share: boolean;
  vibration: boolean;
}

export interface IPlatformAdapter {
  getPlatformName(): string;
  getCapabilities(): PlatformCapabilities;
  quitGame(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  vibrate(duration: number): Promise<void>;
  getStorageAdapter(): IStorageAdapter;
  unlockAchievement(achievementId: string): Promise<void>;
  setStat(statName: string, value: number): Promise<void>;
  getStat(statName: string): Promise<number>;
  isCloudSaveEnabled(): boolean;
  getBackKeyHandler(): (() => boolean) | null;
  shareContent(title: string, content: string): Promise<void>;
}
