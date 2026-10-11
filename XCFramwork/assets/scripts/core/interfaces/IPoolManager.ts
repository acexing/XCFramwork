export interface PoolInfo {
  name: string;
  poolSize: number;
  activeCount: number;
  totalCreated: number;
}

export interface IPoolManager {
  register<T>(
    poolName: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    preloadCount?: number
  ): void;
  get<T>(poolName: string): T;
  release<T>(poolName: string, obj: T): void;
  releaseAll(poolName: string): void;
  getPoolInfo(poolName: string): PoolInfo | null;
  clearAll(): void;
}
