import { IPoolManager, PoolInfo } from '../core/interfaces/IPoolManager';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'PoolManager';

interface PoolRecord {
  name: string;
  createFn: () => unknown;
  resetFn: (obj: unknown) => void;
  available: unknown[];
  active: Set<unknown>;
  totalCreated: number;
}

export class PoolManager implements IPoolManager {
  private logger: ILogger;
  private pools = new Map<string, PoolRecord>();

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  register<T>(
    poolName: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    preloadCount: number = 0
  ): void {
    if (this.pools.has(poolName)) {
      this.logger.warn(LOGGER_TAG, `对象池已存在: ${poolName}`);
      return;
    }

    const record: PoolRecord = {
      name: poolName,
      createFn: createFn as () => unknown,
      resetFn: resetFn as (obj: unknown) => void,
      available: [],
      active: new Set<unknown>(),
      totalCreated: 0,
    };

    this.pools.set(poolName, record);

    for (let i = 0; i < preloadCount; i++) {
      const obj = record.createFn();
      record.available.push(obj);
      record.totalCreated++;
    }

    this.logger.debug(LOGGER_TAG, `注册对象池: ${poolName} 预创建: ${preloadCount}`);
  }

  get<T>(poolName: string): T {
    const record = this.ensurePool(poolName);
    let obj: unknown;
    if (record.available.length > 0) {
      obj = record.available.pop();
    } else {
      obj = record.createFn();
      record.totalCreated++;
    }
    record.active.add(obj);
    return obj as T;
  }

  release<T>(poolName: string, obj: T): void {
    const record = this.pools.get(poolName);
    if (!record) {
      this.logger.warn(LOGGER_TAG, `对象池不存在: ${poolName}`);
      return;
    }
    if (!record.active.has(obj)) {
      this.logger.warn(LOGGER_TAG, `对象不属于该池: ${poolName}`);
      return;
    }
    record.active.delete(obj);
    record.resetFn(obj);
    record.available.push(obj);
  }

  releaseAll(poolName: string): void {
    const record = this.pools.get(poolName);
    if (!record) {
      return;
    }
    for (const obj of Array.from(record.active)) {
      record.resetFn(obj);
      record.available.push(obj);
    }
    record.active.clear();
  }

  getPoolInfo(poolName: string): PoolInfo | null {
    const record = this.pools.get(poolName);
    if (!record) {
      return null;
    }
    return {
      name: record.name,
      poolSize: record.available.length,
      activeCount: record.active.size,
      totalCreated: record.totalCreated,
    };
  }

  clearAll(): void {
    this.pools.clear();
    this.logger.debug(LOGGER_TAG, '所有对象池已清空');
  }

  private ensurePool(poolName: string): PoolRecord {
    const record = this.pools.get(poolName);
    if (!record) {
      throw new Error(`对象池未注册: ${poolName}`);
    }
    return record;
  }
}
