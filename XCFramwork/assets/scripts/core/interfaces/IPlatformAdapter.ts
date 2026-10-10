export interface PlatformCapabilities {
  cloudSave: boolean;
  achievements: boolean;
  overlay: boolean;
  haptics: boolean;
  externalLink: boolean;
  share: boolean;
  vibration: boolean;
}

export interface IStorageAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, data: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  listKeys(prefix: string): Promise<string[]>;
}

export interface IPlatformAdapter {
  getPlatformName(): string;
  getCapabilities(): PlatformCapabilities;
  quitGame(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  vibrate(duration: number): Promise<void>;
  getStorageAdapter(): IStorageAdapter;
}
