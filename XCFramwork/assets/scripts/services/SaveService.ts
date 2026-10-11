import { IStorageAdapter } from '../core/interfaces/IStorageAdapter';
import { ISaveService, SaveEnvelope, SaveInfo, MigrationFn } from '../core/interfaces/ISaveService';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'SaveService';
const CURRENT_SCHEMA_VERSION = 1;
const BACKUP_SUFFIX = '.bak';

export class SaveService implements ISaveService {
  private logger: ILogger;
  private storageAdapter: IStorageAdapter;
  private migrations = new Map<number, MigrationFn>();
  private saveCache = new Map<string, SaveEnvelope<unknown>>();

  constructor(logger: ILogger, storageAdapter: IStorageAdapter) {
    this.logger = logger;
    this.storageAdapter = storageAdapter;
  }

  async load<T>(slot: string): Promise<T | null> {
    const cached = this.saveCache.get(slot);
    if (cached) {
      return cached.data as T;
    }

    try {
      const raw = await this.storageAdapter.read(slot);
      if (raw === null) {
        return null;
      }

      const envelope = JSON.parse(raw) as SaveEnvelope<T>;
      if (!this.validateEnvelope(envelope)) {
        this.logger.error(LOGGER_TAG, `存档格式无效: ${slot}`);
        return await this.tryBackup<T>(slot);
      }

      if (!this.validateChecksum(envelope)) {
        this.logger.warn(LOGGER_TAG, `存档校验和不一致: ${slot}，尝试使用数据`);
      }

      const migrated = this.migrate(envelope);
      this.saveCache.set(slot, migrated as SaveEnvelope<unknown>);
      return migrated.data;
    } catch (error) {
      this.logger.error(LOGGER_TAG, `存档读取失败: ${slot}`, error);
      return await this.tryBackup<T>(slot);
    }
  }

  async save<T>(slot: string, data: T): Promise<void> {
    const envelope: SaveEnvelope<T> = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      savedAt: Date.now(),
      checksum: this.computeChecksum(JSON.stringify(data)),
      data,
    };

    const serialized = JSON.stringify(envelope);

    try {
      await this.storageAdapter.write(slot + '.tmp', serialized);
      const verifyRaw = await this.storageAdapter.read(slot + '.tmp');
      if (verifyRaw !== serialized) {
        await this.storageAdapter.delete(slot + '.tmp');
        throw new Error('临时存档验证失败');
      }

      const existingRaw = await this.storageAdapter.read(slot);
      if (existingRaw !== null) {
        await this.storageAdapter.write(slot + BACKUP_SUFFIX, existingRaw);
      }

      await this.storageAdapter.delete(slot);
      await this.storageAdapter.write(slot, serialized);
      await this.storageAdapter.delete(slot + '.tmp');

      this.saveCache.set(slot, envelope as SaveEnvelope<unknown>);
      this.logger.debug(LOGGER_TAG, `存档已保存: ${slot}`);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `存档写入失败: ${slot}`, error);
      throw error;
    }
  }

  async deleteSave(slot: string): Promise<void> {
    await this.storageAdapter.delete(slot);
    await this.storageAdapter.delete(slot + BACKUP_SUFFIX);
    await this.storageAdapter.delete(slot + '.tmp');
    this.saveCache.delete(slot);
    this.logger.debug(LOGGER_TAG, `存档已删除: ${slot}`);
  }

  hasSave(slot: string): boolean {
    return this.saveCache.has(slot);
  }

  getSaveInfo(slot: string): SaveInfo | null {
    const cached = this.saveCache.get(slot);
    if (cached) {
      return {
        slot,
        schemaVersion: cached.schemaVersion,
        savedAt: cached.savedAt,
        dataSize: JSON.stringify(cached.data).length,
      };
    }
    return null;
  }

  listSaves(): SaveInfo[] {
    const infos: SaveInfo[] = [];
    for (const [slot, envelope] of Array.from(this.saveCache.entries())) {
      infos.push({
        slot,
        schemaVersion: envelope.schemaVersion,
        savedAt: envelope.savedAt,
        dataSize: JSON.stringify(envelope.data).length,
      });
    }
    return infos;
  }

  async exportSave(slot: string): Promise<string> {
    const raw = await this.storageAdapter.read(slot);
    if (raw === null) {
      throw new Error(`存档不存在: ${slot}`);
    }
    return btoa(raw);
  }

  async importSave(slot: string, data: string): Promise<void> {
    const raw = atob(data);
    const envelope = JSON.parse(raw) as SaveEnvelope<unknown>;
    if (!this.validateEnvelope(envelope)) {
      throw new Error(`导入存档格式无效: ${slot}`);
    }
    await this.storageAdapter.write(slot, raw);
    this.saveCache.set(slot, envelope);
    this.logger.info(LOGGER_TAG, `存档已导入: ${slot}`);
  }

  registerMigration(fromVersion: number, fn: MigrationFn): void {
    this.migrations.set(fromVersion, fn);
    this.logger.debug(LOGGER_TAG, `注册迁移函数: v${fromVersion} → v${fromVersion + 1}`);
  }

  private validateEnvelope(envelope: unknown): boolean {
    if (typeof envelope !== 'object' || envelope === null) {
      return false;
    }
    const env = envelope as Record<string, unknown>;
    return (
      typeof env.schemaVersion === 'number' &&
      typeof env.savedAt === 'number' &&
      typeof env.checksum === 'string' &&
      'data' in env
    );
  }

  private validateChecksum<T>(envelope: SaveEnvelope<T>): boolean {
    const expectedChecksum = this.computeChecksum(JSON.stringify(envelope.data));
    return envelope.checksum === expectedChecksum;
  }

  private computeChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private migrate<T>(envelope: SaveEnvelope<T>): SaveEnvelope<T> {
    if (envelope.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return envelope;
    }

    if (envelope.schemaVersion > CURRENT_SCHEMA_VERSION) {
      this.logger.warn(
        LOGGER_TAG,
        `存档版本(${envelope.schemaVersion})高于当前版本(${CURRENT_SCHEMA_VERSION})，尝试前向兼容`
      );
      return envelope;
    }

    let currentData: unknown = envelope.data;
    let currentVersion = envelope.schemaVersion;

    while (currentVersion < CURRENT_SCHEMA_VERSION) {
      const migrationFn = this.migrations.get(currentVersion);
      if (!migrationFn) {
        this.logger.error(LOGGER_TAG, `无迁移函数: v${currentVersion} → v${currentVersion + 1}`);
        return envelope;
      }
      try {
        currentData = migrationFn(currentData);
        currentVersion++;
      } catch (error) {
        this.logger.error(LOGGER_TAG, `迁移失败: v${currentVersion}`, error);
        return envelope;
      }
    }

    const migrated: SaveEnvelope<T> = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      savedAt: envelope.savedAt,
      checksum: this.computeChecksum(JSON.stringify(currentData)),
      data: currentData as T,
    };

    this.logger.info(
      LOGGER_TAG,
      `存档已迁移: v${envelope.schemaVersion} → v${CURRENT_SCHEMA_VERSION}`
    );
    return migrated;
  }

  private async tryBackup<T>(slot: string): Promise<T | null> {
    try {
      const backupRaw = await this.storageAdapter.read(slot + BACKUP_SUFFIX);
      if (backupRaw === null) {
        this.logger.warn(LOGGER_TAG, `备份存档不存在: ${slot}`);
        return null;
      }
      const backupEnvelope = JSON.parse(backupRaw) as SaveEnvelope<T>;
      this.logger.info(LOGGER_TAG, `使用备份存档: ${slot}`);
      return backupEnvelope.data;
    } catch (error) {
      this.logger.error(LOGGER_TAG, `备份存档读取失败: ${slot}`, error);
      return null;
    }
  }
}
