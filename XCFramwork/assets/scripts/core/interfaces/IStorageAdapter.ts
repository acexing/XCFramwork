export interface IStorageAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, data: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  listKeys(prefix: string): Promise<string[]>;
}
