import { sys } from 'cc';
import { IStorageAdapter } from '../core/interfaces/IStorageAdapter';

const KEY_PREFIX = 'save_';

export class DesktopStorageAdapter implements IStorageAdapter {
  async read(key: string): Promise<string | null> {
    const fullKey = KEY_PREFIX + key;
    const data = sys.localStorage.getItem(fullKey);
    return data ?? null;
  }

  async write(key: string, data: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    sys.localStorage.setItem(fullKey, data);
  }

  async delete(key: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    sys.localStorage.removeItem(fullKey);
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = KEY_PREFIX + key;
    return sys.localStorage.getItem(fullKey) !== null;
  }

  async listKeys(prefix: string): Promise<string[]> {
    const fullPrefix = KEY_PREFIX + prefix;
    const keys: string[] = [];
    const length = sys.localStorage.length;
    for (let i = 0; i < length; i++) {
      const key = sys.localStorage.key(i);
      if (key && key.indexOf(fullPrefix) === 0) {
        keys.push(key.substring(KEY_PREFIX.length));
      }
    }
    return keys;
  }
}
