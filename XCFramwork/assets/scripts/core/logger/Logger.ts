import { DEBUG } from 'cc/env';
import { ILogger, LogLevel } from '../interfaces/ILogger';

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.Debug]: 'DEBUG',
  [LogLevel.Info]: 'INFO',
  [LogLevel.Warn]: 'WARN',
  [LogLevel.Error]: 'ERROR',
  [LogLevel.None]: 'NONE',
};

export class Logger implements ILogger {
  private level: LogLevel;
  private isDevMode: boolean;
  private disabledTags: Set<string> = new Set();

  constructor(isDevMode: boolean = DEBUG) {
    this.isDevMode = isDevMode;
    this.level = isDevMode ? LogLevel.Debug : LogLevel.Warn;
  }

  debug(tag: string, message: string, ...args: unknown[]): void {
    this.output(LogLevel.Debug, tag, message, args);
  }

  info(tag: string, message: string, ...args: unknown[]): void {
    this.output(LogLevel.Info, tag, message, args);
  }

  warn(tag: string, message: string, ...args: unknown[]): void {
    this.output(LogLevel.Warn, tag, message, args);
  }

  error(tag: string, message: string, ...args: unknown[]): void {
    this.output(LogLevel.Error, tag, message, args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  enableTag(tag: string): void {
    this.disabledTags.delete(tag);
  }

  disableTag(tag: string): void {
    this.disabledTags.add(tag);
  }

  private shouldLog(level: LogLevel, tag: string): boolean {
    if (this.disabledTags.has(tag)) {
      return false;
    }
    return level >= this.level && this.level !== LogLevel.None;
  }

  private formatMessage(tag: string, level: LogLevel, message: string, args: unknown[]): string {
    const now = new Date();
    const pad = (value: number): string => (value < 10 ? `0${value}` : `${value}`);
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const base = `[${time}] [${LEVEL_LABELS[level]}] [${tag}] ${message}`;
    if (args.length === 0) {
      return base;
    }
    const argTexts = args.map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });
    return `${base} ${argTexts.join(' ')}`;
  }

  private output(level: LogLevel, tag: string, message: string, args: unknown[]): void {
    if (!this.shouldLog(level, tag)) {
      return;
    }
    const text = this.formatMessage(tag, level, message, args);
    switch (level) {
      case LogLevel.Debug:
      case LogLevel.Info:
        console.log(text);
        break;
      case LogLevel.Warn:
        console.warn(text);
        break;
      case LogLevel.Error:
        console.error(text);
        break;
      default:
        break;
    }
  }
}
