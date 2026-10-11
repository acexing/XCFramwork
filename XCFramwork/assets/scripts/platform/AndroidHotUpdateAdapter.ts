import {
  HotUpdateState,
  UpdateCheckResult,
  UpdateProgress,
  VersionInfo,
} from '../core/interfaces/IHotUpdateService';
import { IHotUpdateAdapter } from '../core/interfaces/IHotUpdateAdapter';

interface AssetsManagerEvent {
  getMessage(): string;
  getAssetId(): string;
  getPercent(): number;
  getDownloadedBytes(): number;
  getTotalBytes(): number;
}

interface IAssetsManager {
  loadLocalManifest(manifestUrl: string): void;
  loadRemoteManifest(manifestUrl: string): void;
  update(): void;
  pause(): void;
  resume(): void;
  cancel(): void;
  setVerifyCallback(cb: (assetId: string, callback: (verified: boolean) => void) => void): void;
  setDownloadCallback(cb: (event: AssetsManagerEvent) => void): void;
  setDownloadFailedCallback(cb: (event: AssetsManagerEvent) => void): void;
  getState(): number;
  getLocalManifest(): unknown;
  getRemoteManifest(): unknown;
  getDownloadedFiles(): number;
  getTotalFiles(): number;
  getDownloadedBytes(): number;
  getTotalBytes(): number;
  isDownloadSuccess(): boolean;
  destroy(): void;
}

const HOT_UPDATE_STATE_UNSTARTED = 0;
const HOT_UPDATE_STATE_CHECKING = 1;
const HOT_UPDATE_STATE_UPDATING = 2;
const HOT_UPDATE_STATE_PAUSED = 3;
const HOT_UPDATE_STATE_FAILED = 4;
const HOT_UPDATE_STATE_SUCCEED = 5;

export class AndroidHotUpdateAdapter implements IHotUpdateAdapter {
  private assetsManager: IAssetsManager | null = null;
  private storagePath: string = '';
  private manifestUrl: string = '';
  private versionUrl: string = '';
  private currentProgress: UpdateProgress = {
    state: HotUpdateState.Idle,
    downloadedBytes: 0,
    totalBytes: 0,
    fileIndex: 0,
    totalFiles: 0,
    currentFile: '',
    speedBytesPerSec: 0,
  };
  private versionInfo: VersionInfo = {
    localVersion: '',
    manifestVersion: '',
    lastUpdated: 0,
  };
  private downloadStartTime: number = 0;

  isHotUpdateSupported(): boolean {
    return this.getJsb() !== null;
  }

  getStoragePath(): string {
    if (!this.storagePath) {
      const jsbObj = this.getJsb();
      if (jsbObj) {
        const fileUtils = (jsbObj as Record<string, unknown>).fileUtils;
        if (fileUtils && typeof fileUtils === 'object') {
          const getWritablePath = (fileUtils as Record<string, unknown>).getWritablePath;
          if (typeof getWritablePath === 'function') {
            this.storagePath = (getWritablePath as () => string)() + 'hotupdate/';
          }
        }
      }
    }
    return this.storagePath;
  }

  async checkUpdate(manifestUrl: string, versionUrl: string): Promise<UpdateCheckResult> {
    this.manifestUrl = manifestUrl;
    this.versionUrl = versionUrl;

    const jsbObj = this.getJsb();
    if (!jsbObj) {
      return this.createNoUpdateResult();
    }

    this.ensureAssetsManager();

    if (!this.assetsManager) {
      return this.createNoUpdateResult();
    }

    try {
      this.assetsManager.loadLocalManifest(this.storagePath + 'project.manifest');
      this.assetsManager.loadRemoteManifest(versionUrl);
      this.currentProgress.state = HotUpdateState.Checking;

      const localManifest = this.assetsManager.getLocalManifest() as Record<string, unknown> | null;
      const remoteManifest = this.assetsManager.getRemoteManifest() as Record<
        string,
        unknown
      > | null;

      if (!remoteManifest) {
        return this.createNoUpdateResult();
      }

      const remoteVersion = (remoteManifest.version as string) ?? '';
      const localVersion = (localManifest?.version as string) ?? '';
      const forceUpdate = (remoteManifest.forceUpdate as boolean) ?? false;
      const minSupportedVersion = (remoteManifest.minSupportedVersion as string) ?? '';
      const updateNotes = this.extractUpdateNotes(remoteManifest);

      const hasUpdate = this.compareVersions(remoteVersion, localVersion) > 0;

      let updateSizeBytes = 0;
      if (hasUpdate) {
        const assets = remoteManifest.assets as Record<string, Record<string, unknown>> | undefined;
        if (assets) {
          for (const key of Object.keys(assets)) {
            const size = assets[key].size;
            if (typeof size === 'number') {
              updateSizeBytes += size;
            }
          }
        }
      }

      this.versionInfo.localVersion = localVersion;
      this.versionInfo.manifestVersion = remoteVersion;

      return {
        hasUpdate,
        isForceUpdate: forceUpdate,
        remoteVersion,
        localVersion,
        updateSizeBytes,
        updateNotes,
        minSupportedVersion,
      };
    } catch {
      return this.createNoUpdateResult();
    }
  }

  async startUpdate(manifestUrl: string, storagePath: string): Promise<void> {
    this.manifestUrl = manifestUrl;
    this.storagePath = storagePath;

    if (!this.assetsManager) {
      this.ensureAssetsManager();
    }

    if (!this.assetsManager) {
      return;
    }

    this.downloadStartTime = Date.now();
    this.currentProgress.state = HotUpdateState.Downloading;
    this.currentProgress.downloadedBytes = 0;
    this.currentProgress.totalBytes = 0;
    this.currentProgress.fileIndex = 0;
    this.currentProgress.totalFiles = 0;

    this.assetsManager.update();
  }

  pauseUpdate(): void {
    if (this.assetsManager) {
      this.assetsManager.pause();
      this.currentProgress.state = HotUpdateState.Paused;
    }
  }

  async resumeUpdate(): Promise<void> {
    if (this.assetsManager) {
      this.assetsManager.resume();
      this.currentProgress.state = HotUpdateState.Downloading;
    }
  }

  async cancelUpdate(): Promise<void> {
    if (this.assetsManager) {
      this.assetsManager.cancel();
      this.currentProgress.state = HotUpdateState.Failed;
    }
  }

  applyUpdate(): void {
    if (this.assetsManager && this.assetsManager.isDownloadSuccess()) {
      this.currentProgress.state = HotUpdateState.ReadyToRestart;
      const jsbObj = this.getJsb();
      if (jsbObj) {
        const restartGame = (jsbObj as Record<string, unknown>).restartGame;
        if (typeof restartGame === 'function') {
          (restartGame as () => void)();
        }
      }
    }
  }

  async rollback(): Promise<boolean> {
    try {
      const jsbObj = this.getJsb();
      if (!jsbObj) {
        return false;
      }

      const fileUtils = (jsbObj as Record<string, unknown>).fileUtils;
      if (!fileUtils || typeof fileUtils !== 'object') {
        return false;
      }

      const backupPath = this.storagePath + 'backup/';
      const isFileExist = (fileUtils as Record<string, unknown>).isFileExist;
      if (typeof isFileExist !== 'function') {
        return false;
      }

      const backupExists = (isFileExist as (path: string) => boolean)(
        backupPath + 'project.manifest'
      );
      if (!backupExists) {
        return false;
      }

      const removeFile = (fileUtils as Record<string, unknown>).removeFile;
      const createDirectory = (fileUtils as Record<string, unknown>).createDirectory;
      const writeStringToFile = (fileUtils as Record<string, unknown>).writeStringToFile;
      const readTextFile = (fileUtils as Record<string, unknown>).readTextFile;

      if (typeof removeFile === 'function') {
        (removeFile as (path: string) => boolean)(this.storagePath + 'project.manifest');
      }

      if (typeof readTextFile === 'function' && typeof writeStringToFile === 'function') {
        const backupManifest = (readTextFile as (path: string) => string)(
          backupPath + 'project.manifest'
        );
        (writeStringToFile as (content: string, path: string) => boolean)(
          backupManifest,
          this.storagePath + 'project.manifest'
        );
      }

      this.currentProgress.state = HotUpdateState.RolledBack;
      return true;
    } catch {
      return false;
    }
  }

  getUpdateProgress(): UpdateProgress {
    if (this.assetsManager) {
      this.currentProgress.downloadedBytes = this.assetsManager.getDownloadedBytes();
      this.currentProgress.totalBytes = this.assetsManager.getTotalBytes();
      this.currentProgress.fileIndex = this.assetsManager.getDownloadedFiles();
      this.currentProgress.totalFiles = this.assetsManager.getTotalFiles();

      const elapsed = (Date.now() - this.downloadStartTime) / 1000;
      if (elapsed > 0 && this.currentProgress.downloadedBytes > 0) {
        this.currentProgress.speedBytesPerSec = Math.round(
          this.currentProgress.downloadedBytes / elapsed
        );
      }
    }
    return this.currentProgress;
  }

  getVersionInfo(): VersionInfo {
    return this.versionInfo;
  }

  destroy(): void {
    if (this.assetsManager) {
      this.assetsManager.destroy();
      this.assetsManager = null;
    }
  }

  private getJsb(): Record<string, unknown> | null {
    try {
      const globalObj = typeof globalThis !== 'undefined' ? globalThis : undefined;
      if (globalObj) {
        const jsbObj = (globalObj as Record<string, unknown>).jsb;
        if (jsbObj && typeof jsbObj === 'object') {
          return jsbObj as Record<string, unknown>;
        }
      }
    } catch {
      // jsb 不可用
    }
    return null;
  }

  private ensureAssetsManager(): void {
    if (this.assetsManager) {
      return;
    }

    const jsbObj = this.getJsb();
    if (!jsbObj) {
      return;
    }

    const AssetsManagerCtor = jsbObj.AssetsManager;
    if (typeof AssetsManagerCtor !== 'function') {
      return;
    }

    try {
      this.assetsManager = new (
        AssetsManagerCtor as new (
          manifestUrl: string,
          storagePath: string,
          versionCompareHandler: (a: string, b: string) => number
        ) => IAssetsManager
      )(this.manifestUrl, this.storagePath, (versionA: string, versionB: string) =>
        this.compareVersions(versionA, versionB)
      );

      this.setupCallbacks();
    } catch {
      this.assetsManager = null;
    }
  }

  private setupCallbacks(): void {
    if (!this.assetsManager) {
      return;
    }

    this.assetsManager.setDownloadCallback((event: AssetsManagerEvent) => {
      this.currentProgress.downloadedBytes = event.getDownloadedBytes();
      this.currentProgress.totalBytes = event.getTotalBytes();
      this.currentProgress.currentFile = event.getAssetId();
      this.currentProgress.state = HotUpdateState.Downloading;
    });

    this.assetsManager.setDownloadFailedCallback((event: AssetsManagerEvent) => {
      this.currentProgress.state = HotUpdateState.Failed;
      this.currentProgress.currentFile = event.getAssetId();
    });

    this.assetsManager.setVerifyCallback(
      (assetId: string, callback: (verified: boolean) => void) => {
        this.currentProgress.state = HotUpdateState.Verifying;
        this.currentProgress.currentFile = assetId;
        callback(true);
      }
    );
  }

  private compareVersions(versionA: string, versionB: string): number {
    const partsA = versionA.split('.');
    const partsB = versionB.split('.');
    const maxLen = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLen; i++) {
      const a = parseInt(partsA[i] ?? '0', 10);
      const b = parseInt(partsB[i] ?? '0', 10);
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
    }
    return 0;
  }

  private extractUpdateNotes(manifest: Record<string, unknown>): string {
    const updateNotes = manifest.updateNotes;
    if (typeof updateNotes === 'string') {
      return updateNotes;
    }
    if (updateNotes && typeof updateNotes === 'object') {
      const notesObj = updateNotes as Record<string, string>;
      return notesObj.zh ?? notesObj.en ?? '';
    }
    return '';
  }

  private createNoUpdateResult(): UpdateCheckResult {
    return {
      hasUpdate: false,
      isForceUpdate: false,
      remoteVersion: '',
      localVersion: this.versionInfo.localVersion,
      updateSizeBytes: 0,
      updateNotes: '',
      minSupportedVersion: '',
    };
  }
}
