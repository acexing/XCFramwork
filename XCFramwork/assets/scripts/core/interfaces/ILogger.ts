export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

export interface ILogger {
  debug(tag: string, message: string, ...args: unknown[]): void;
  info(tag: string, message: string, ...args: unknown[]): void;
  warn(tag: string, message: string, ...args: unknown[]): void;
  error(tag: string, message: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  enableTag(tag: string): void;
  disableTag(tag: string): void;
}
