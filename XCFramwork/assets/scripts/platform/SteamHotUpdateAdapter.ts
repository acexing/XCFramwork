import {
  HotUpdateState,
  UpdateCheckResult,
  UpdateProgress,
  VersionInfo,
} from '../core/interfaces/IHotUpdateService';
import { IHotUpdateAdapter } from '../core/interfaces/IHotUpdateAdapter';

export class SteamHotUpdateAdapter implements IHotUpdateAdapter {
  isHotUpdateSupported(): boolean {
    return false;
  }

  getStoragePath(): string {
    return '';
  }

  async checkUpdate(_manifestUrl: string, _versionUrl: string): Promise<UpdateCheckResult> {
    return {
      hasUpdate: false,
      isForceUpdate: false,
      remoteVersion: '',
      localVersion: '',
      updateSizeBytes: 0,
      updateNotes: '',
      minSupportedVersion: '',
    };
  }

  async startUpdate(_manifestUrl: string, _storagePath: string): Promise<void> {
    return;
  }

  pauseUpdate(): void {}

  async resumeUpdate(): Promise<void> {
    return;
  }

  async cancelUpdate(): Promise<void> {
    return;
  }

  applyUpdate(): void {}

  async rollback(): Promise<boolean> {
    return false;
  }

  getUpdateProgress(): UpdateProgress {
    return {
      state: HotUpdateState.UpToDate,
      downloadedBytes: 0,
      totalBytes: 0,
      fileIndex: 0,
      totalFiles: 0,
      currentFile: '',
      speedBytesPerSec: 0,
    };
  }

  getVersionInfo(): VersionInfo {
    return {
      localVersion: '',
      manifestVersion: '',
      lastUpdated: 0,
    };
  }

  destroy(): void {}
}
