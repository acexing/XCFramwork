export interface SaveEnvelope<T> {
  schemaVersion: number;
  savedAt: number;
  checksum: string;
  data: T;
}

export interface SaveInfo {
  slot: string;
  schemaVersion: number;
  savedAt: number;
  dataSize: number;
}

export type MigrationFn = (oldData: unknown) => unknown;

export interface ISaveService {
  load<T>(slot: string): Promise<T | null>;
  save<T>(slot: string, data: T): Promise<void>;
  deleteSave(slot: string): Promise<void>;
  hasSave(slot: string): boolean;
  getSaveInfo(slot: string): SaveInfo | null;
  listSaves(): SaveInfo[];
  exportSave(slot: string): Promise<string>;
  importSave(slot: string, data: string): Promise<void>;
  registerMigration(fromVersion: number, fn: MigrationFn): void;
}
