import { IStorageAdapter, PlatformCapabilities } from './IPlatformAdapter';

export interface IPlatformService {
  getPlatformName(): string;
  getCapabilities(): PlatformCapabilities;
  quitGame(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  vibrate(duration: number): Promise<void>;
  getStorageAdapter(): IStorageAdapter;
}
