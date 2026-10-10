import { sys } from 'cc';
import { IStorageAdapter } from '../core/interfaces/IPlatformAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
  read(key: string): Promise<string | null> {
    try {
      return Promise.resolve(sys.localStorage.getItem(key));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  write(key: string, data: string): Promise<void> {
    try {
      sys.localStorage.setItem(key, data);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  delete(key: string): Promise<void> {
    try {
      sys.localStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  exists(key: string): Promise<boolean> {
    try {
      return Promise.resolve(sys.localStorage.getItem(key) !== null);
    } catch {
      return Promise.resolve(false);
    }
  }

  listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    const storage = sys.localStorage as unknown as {
      length: number;
      key(index: number): string | null;
    };
    const total = storage.length ?? 0;
    for (let i = 0; i < total; i++) {
      const key = storage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return Promise.resolve(keys.filter((key) => key.startsWith(prefix)));
  }
}
