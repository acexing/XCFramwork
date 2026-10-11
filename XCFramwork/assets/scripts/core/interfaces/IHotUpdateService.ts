export enum HotUpdateState {
  Idle = 'Idle',
  Checking = 'Checking',
  Available = 'Available',
  Downloading = 'Downloading',
  Paused = 'Paused',
  Verifying = 'Verifying',
  Patching = 'Patching',
  ReadyToRestart = 'ReadyToRestart',
  UpToDate = 'UpToDate',
  Failed = 'Failed',
  RolledBack = 'RolledBack',
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isForceUpdate: boolean;
  remoteVersion: string;
  localVersion: string;
  updateSizeBytes: number;
  updateNotes: string;
  minSupportedVersion: string;
}

export interface UpdateProgress {
  state: HotUpdateState;
  downloadedBytes: number;
  totalBytes: number;
  fileIndex: number;
  totalFiles: number;
  currentFile: string;
  speedBytesPerSec: number;
}

export interface VersionInfo {
  localVersion: string;
  manifestVersion: string;
  lastUpdated: number;
}

export interface HotUpdateConfig {
  manifestUrl: string;
  versionUrl: string;
  storagePath: string;
  timeoutMs: number;
  maxRetry: number;
  checkOnStartup: boolean;
}

export interface IHotUpdateService {
  init(config: HotUpdateConfig): Promise<void>;
  checkUpdate(): Promise<UpdateCheckResult>;
  startUpdate(): Promise<void>;
  pauseUpdate(): void;
  resumeUpdate(): Promise<void>;
  cancelUpdate(): Promise<void>;
  applyUpdate(): void;
  rollback(): Promise<boolean>;
  getUpdateState(): HotUpdateState;
  getUpdateProgress(): UpdateProgress;
  getVersionInfo(): VersionInfo;
  onStateChange(handler: (state: HotUpdateState) => void): void;
  offStateChange(handler: (state: HotUpdateState) => void): void;
}
