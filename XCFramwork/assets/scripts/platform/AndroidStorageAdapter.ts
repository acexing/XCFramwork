interface NativeFileUtils {
  isFileExist(path: string): boolean;
  readTextFile(filepath: string, onComplete: (err: string | null, content: string) => void): void;
  writeStringToFile(dataStr: string, fullPath: string): boolean;
  removeFile(filepath: string): boolean;
  createDirectory(dirPath: string): string;
  getWritablePath(): string;
}

import { sys } from 'cc';
import { IStorageAdapter } from '../core/interfaces/IStorageAdapter';

const SAVE_DIR_PREFIX = 'saves';

export class AndroidStorageAdapter implements IStorageAdapter {
  private writablePath: string;

  constructor() {
    this.writablePath = this.getWritablePath();
  }

  async read(key: string): Promise<string | null> {
    const fullPath = this.buildPath(key);
    return new Promise<string | null>((resolve) => {
      const nativeObj = this.getNativeFileUtils();
      if (!nativeObj) {
        resolve(sys.localStorage.getItem(key));
        return;
      }
      if (!nativeObj.isFileExist(fullPath)) {
        resolve(null);
        return;
      }
      nativeObj.readTextFile(fullPath, (err: string | null, content: string) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(content);
      });
    });
  }

  async write(key: string, data: string): Promise<void> {
    const fullPath = this.buildPath(key);
    return new Promise<void>((resolve, reject) => {
      const nativeObj = this.getNativeFileUtils();
      if (!nativeObj) {
        sys.localStorage.setItem(key, data);
        resolve();
        return;
      }
      this.ensureDirectory(fullPath);
      const success = nativeObj.writeStringToFile(data, fullPath);
      if (success) {
        resolve();
      } else {
        reject(new Error(`写入失败: ${fullPath}`));
      }
    });
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.buildPath(key);
    return new Promise<void>((resolve) => {
      const nativeObj = this.getNativeFileUtils();
      if (!nativeObj) {
        sys.localStorage.removeItem(key);
        resolve();
        return;
      }
      if (nativeObj.isFileExist(fullPath)) {
        nativeObj.removeFile(fullPath);
      }
      resolve();
    });
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.buildPath(key);
    return new Promise<boolean>((resolve) => {
      const nativeObj = this.getNativeFileUtils();
      if (!nativeObj) {
        resolve(sys.localStorage.getItem(key) !== null);
        return;
      }
      resolve(nativeObj.isFileExist(fullPath));
    });
  }

  async listKeys(prefix: string): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      const nativeObj = this.getNativeFileUtils();
      if (!nativeObj) {
        const keys: string[] = [];
        const length = sys.localStorage.length;
        for (let i = 0; i < length; i++) {
          const key = sys.localStorage.key(i);
          if (key && key.indexOf(prefix) === 0) {
            keys.push(key);
          }
        }
        resolve(keys);
        return;
      }
      resolve([]);
    });
  }

  private buildPath(key: string): string {
    return `${this.writablePath}/${SAVE_DIR_PREFIX}/${key}.json`;
  }

  private ensureDirectory(fullPath: string): void {
    const nativeObj = this.getNativeFileUtils();
    if (!nativeObj) {
      return;
    }
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (!nativeObj.isFileExist(dirPath)) {
      nativeObj.createDirectory(dirPath);
    }
  }

  private getWritablePath(): string {
    const nativeObj = this.getNativeFileUtils();
    if (!nativeObj) {
      return '';
    }
    return nativeObj.getWritablePath();
  }

  private getNativeFileUtils(): NativeFileUtils | null {
    try {
      const nativeModule = (cc as unknown as Record<string, unknown>).native;
      if (nativeModule && typeof nativeModule === 'object') {
        const fileUtils = (nativeModule as Record<string, unknown>).fileUtils;
        if (fileUtils && typeof fileUtils === 'object') {
          return fileUtils as NativeFileUtils;
        }
      }
    } catch {
      // native 不可用（编辑器/Web 环境）
    }
    return null;
  }
}
