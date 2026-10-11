import { sys } from 'cc';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import {
  IHotUpdateService,
  HotUpdateState,
  UpdateCheckResult,
  UpdateProgress,
  VersionInfo,
  HotUpdateConfig,
} from '../core/interfaces/IHotUpdateService';
import { IHotUpdateAdapter } from '../core/interfaces/IHotUpdateAdapter';
import { IEventBus } from '../core/interfaces/IEventBus';
import { ILogger } from '../core/interfaces/ILogger';
import { ServiceRegistry } from '../app/ServiceRegistry';
import { GAME_EVENTS } from '../core/events/GameEvents';

const LOGGER_TAG = 'HotUpdateService';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRY = 3;
const ROLLBACK_COOLDOWN_DAYS = 7;
const ROLLBACK_COOLDOWN_MS = ROLLBACK_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export class HotUpdateService implements IHotUpdateService {
  private logger: ILogger;
  private adapter: IHotUpdateAdapter | null = null;
  private eventBus: IEventBus | null = null;
  private config: HotUpdateConfig | null = null;
  private state: HotUpdateState = HotUpdateState.Idle;
  private checkResult: UpdateCheckResult | null = null;
  private stateHandlers: ((state: HotUpdateState) => void)[] = [];
  private retryCount: number = 0;
  private rolledBackFromVersion: string = '';
  private rolledBackTimestamp: number = 0;
  private initialized: boolean = false;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async init(config: HotUpdateConfig): Promise<void> {
    this.config = config;
    this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);

    this.loadRollbackRecord();

    this.logger.info(
      LOGGER_TAG,
      `热更新服务初始化，支持: ${this.adapter?.isHotUpdateSupported() ?? false}`
    );
    this.initialized = true;
  }

  setAdapter(adapter: IHotUpdateAdapter): void {
    this.adapter = adapter;
  }

  async checkUpdate(): Promise<UpdateCheckResult> {
    if (!this.adapter || !this.config) {
      return this.createNoUpdateResult();
    }

    if (!this.adapter.isHotUpdateSupported()) {
      this.setState(HotUpdateState.UpToDate);
      return this.createNoUpdateResult();
    }

    if (this.isInRollbackCooldown()) {
      this.logger.info(
        LOGGER_TAG,
        `版本 ${this.rolledBackFromVersion} 处于回滚冷却期，跳过更新检查`
      );
      this.setState(HotUpdateState.UpToDate);
      return this.createNoUpdateResult();
    }

    this.setState(HotUpdateState.Checking);
    this.retryCount = 0;

    try {
      const result = await this.adapter.checkUpdate(
        this.config.manifestUrl,
        this.config.versionUrl
      );
      this.checkResult = result;

      if (result.hasUpdate) {
        this.setState(HotUpdateState.Available);
      } else {
        this.setState(HotUpdateState.UpToDate);
      }

      return result;
    } catch (error) {
      this.logger.warn(LOGGER_TAG, '版本检查失败，视为无更新', error);
      this.setState(HotUpdateState.UpToDate);
      return this.createNoUpdateResult();
    }
  }

  async startUpdate(): Promise<void> {
    if (!this.adapter || !this.config) {
      return;
    }

    if (!this.checkResult?.hasUpdate) {
      this.logger.warn(LOGGER_TAG, '无可用更新，跳过下载');
      return;
    }

    this.setState(HotUpdateState.Downloading);
    this.retryCount = 0;

    const storagePath = this.adapter.getStoragePath() || this.config.storagePath;

    try {
      await this.adapter.startUpdate(this.config.manifestUrl, storagePath);
    } catch (error) {
      this.logger.error(LOGGER_TAG, '下载失败', error);
      this.retryOrFailed(error);
    }
  }

  pauseUpdate(): void {
    if (this.adapter) {
      this.adapter.pauseUpdate();
      this.setState(HotUpdateState.Paused);
    }
  }

  async resumeUpdate(): Promise<void> {
    if (this.adapter) {
      await this.adapter.resumeUpdate();
      this.setState(HotUpdateState.Downloading);
    }
  }

  async cancelUpdate(): Promise<void> {
    if (this.adapter) {
      await this.adapter.cancelUpdate();
      this.setState(HotUpdateState.Failed);
    }
  }

  applyUpdate(): void {
    if (this.adapter) {
      this.adapter.applyUpdate();
      this.setState(HotUpdateState.ReadyToRestart);
    }
  }

  async rollback(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }

    this.logger.info(LOGGER_TAG, '执行回滚');
    const success = await this.adapter.rollback();

    if (success) {
      this.rolledBackFromVersion = this.checkResult?.remoteVersion ?? '';
      this.rolledBackTimestamp = Date.now();
      this.saveRollbackRecord();
      this.setState(HotUpdateState.RolledBack);
    }

    return success;
  }

  getUpdateState(): HotUpdateState {
    return this.state;
  }

  getUpdateProgress(): UpdateProgress {
    if (this.adapter) {
      return this.adapter.getUpdateProgress();
    }
    return {
      state: this.state,
      downloadedBytes: 0,
      totalBytes: 0,
      fileIndex: 0,
      totalFiles: 0,
      currentFile: '',
      speedBytesPerSec: 0,
    };
  }

  getVersionInfo(): VersionInfo {
    if (this.adapter) {
      return this.adapter.getVersionInfo();
    }
    return {
      localVersion: '',
      manifestVersion: '',
      lastUpdated: 0,
    };
  }

  onStateChange(handler: (state: HotUpdateState) => void): void {
    this.stateHandlers.push(handler);
  }

  offStateChange(handler: (state: HotUpdateState) => void): void {
    const index = this.stateHandlers.indexOf(handler);
    if (index >= 0) {
      this.stateHandlers.splice(index, 1);
    }
  }

  destroy(): void {
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.stateHandlers = [];
  }

  private setState(newState: HotUpdateState): void {
    if (this.state === newState) {
      return;
    }

    this.state = newState;
    this.logger.debug(LOGGER_TAG, `状态变更: ${newState}`);

    for (const handler of this.stateHandlers) {
      handler(newState);
    }

    if (this.eventBus) {
      this.eventBus.emit(GAME_EVENTS.HOT_UPDATE_STATE_CHANGED, {
        state: newState,
        isForceUpdate: this.checkResult?.isForceUpdate ?? false,
        remoteVersion: this.checkResult?.remoteVersion ?? '',
        localVersion: this.checkResult?.localVersion ?? '',
        updateNotes: this.checkResult?.updateNotes ?? '',
      });

      const progress = this.getUpdateProgress();
      this.eventBus.emit(GAME_EVENTS.HOT_UPDATE_PROGRESS, {
        state: newState,
        downloadedBytes: progress.downloadedBytes,
        totalBytes: progress.totalBytes,
        fileIndex: progress.fileIndex,
        totalFiles: progress.totalFiles,
        currentFile: progress.currentFile,
        speedBytesPerSec: progress.speedBytesPerSec,
      });
    }
  }

  private retryOrFailed(error: unknown): void {
    this.retryCount++;
    const maxRetry = this.config?.maxRetry ?? DEFAULT_MAX_RETRY;

    if (this.retryCount < maxRetry) {
      this.logger.info(LOGGER_TAG, `重试下载 (${this.retryCount}/${maxRetry})`);
      this.startUpdate().catch((retryError) => {
        this.logger.error(LOGGER_TAG, '重试下载失败', retryError);
      });
    } else {
      this.logger.error(LOGGER_TAG, `下载失败，已达最大重试次数 ${maxRetry}`, error);
      this.setState(HotUpdateState.Failed);
    }
  }

  private isInRollbackCooldown(): boolean {
    if (!this.rolledBackFromVersion) {
      return false;
    }
    if (!this.checkResult) {
      return false;
    }
    if (this.checkResult.remoteVersion !== this.rolledBackFromVersion) {
      return false;
    }
    return Date.now() - this.rolledBackTimestamp < ROLLBACK_COOLDOWN_MS;
  }

  private loadRollbackRecord(): void {
    try {
      const raw = sys.localStorage.getItem('hotupdate_rollback_version');
      if (raw) {
        this.rolledBackFromVersion = raw;
      }
      const timestampRaw = sys.localStorage.getItem('hotupdate_rollback_timestamp');
      if (timestampRaw) {
        this.rolledBackTimestamp = parseInt(timestampRaw, 10);
      }
    } catch {
      // localStorage 不可用
    }
  }

  private saveRollbackRecord(): void {
    try {
      sys.localStorage.setItem('hotupdate_rollback_version', this.rolledBackFromVersion);
      sys.localStorage.setItem('hotupdate_rollback_timestamp', String(this.rolledBackTimestamp));
    } catch {
      // localStorage 不可用
    }
  }

  private createNoUpdateResult(): UpdateCheckResult {
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
}
