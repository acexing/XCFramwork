import {
  HotUpdateState,
  UpdateCheckResult,
  UpdateProgress,
  VersionInfo,
} from './IHotUpdateService';

export interface IHotUpdateAdapter {
  isHotUpdateSupported(): boolean;
  getStoragePath(): string;
  checkUpdate(manifestUrl: string, versionUrl: string): Promise<UpdateCheckResult>;
  startUpdate(manifestUrl: string, storagePath: string): Promise<void>;
  pauseUpdate(): void;
  resumeUpdate(): Promise<void>;
  cancelUpdate(): Promise<void>;
  applyUpdate(): void;
  rollback(): Promise<boolean>;
  getUpdateProgress(): UpdateProgress;
  getVersionInfo(): VersionInfo;
  destroy(): void;
}
