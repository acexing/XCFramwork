import { DEBUG } from 'cc/env';
import { EventHandler, IEventBus } from '../core/interfaces/IEventBus';
import { ILogger } from '../core/interfaces/ILogger';

interface ListenerRecord {
  handler: EventHandler;
  target: unknown;
  once: boolean;
}

const LOGGER_TAG = 'EventBus';

export class EventBus implements IEventBus {
  private logger: ILogger;
  private listeners = new Map<string, ListenerRecord[]>();
  private emitCounts = new Map<string, number>();

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  on<T>(event: string, handler: EventHandler<T>, target?: unknown): void {
    this.addListener(event, handler as EventHandler, target, false);
  }

  once<T>(event: string, handler: EventHandler<T>, target?: unknown): void {
    this.addListener(event, handler as EventHandler, target, true);
  }

  off(event: string, handler?: EventHandler, target?: unknown): void {
    const records = this.listeners.get(event);
    if (!records) {
      this.logger.debug(LOGGER_TAG, `移除订阅，事件无监听: ${event}`);
      return;
    }
    const remaining = records.filter((record) => {
      const handlerMatch = handler ? record.handler !== handler : false;
      const targetMatch = target !== undefined ? record.target !== target : false;
      return handlerMatch || targetMatch;
    });
    if (remaining.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, remaining);
    }
  }

  offByTarget(target: unknown): void {
    for (const event of Array.from(this.listeners.keys())) {
      const records = this.listeners.get(event);
      if (!records) {
        continue;
      }
      const remaining = records.filter((record) => record.target !== target);
      if (remaining.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, remaining);
      }
    }
  }

  emit<T>(event: string, data?: T): void {
    const records = this.listeners.get(event);
    if (!records || records.length === 0) {
      this.logger.debug(LOGGER_TAG, `事件无订阅者: ${event}`);
      return;
    }
    if (DEBUG) {
      const count = (this.emitCounts.get(event) ?? 0) + 1;
      this.emitCounts.set(event, count);
      this.logger.debug(LOGGER_TAG, `触发事件: ${event} 第${count}次 订阅数:${records.length}`);
    }
    const toRemove: ListenerRecord[] = [];
    for (const record of [...records]) {
      try {
        record.handler(data);
      } catch (error) {
        this.logger.error(LOGGER_TAG, `事件处理异常: ${event}`, error);
      }
      if (record.once) {
        toRemove.push(record);
      }
    }
    for (const record of toRemove) {
      this.removeListenerRecord(event, record);
    }
  }

  hasListener(event: string): boolean {
    const records = this.listeners.get(event);
    return records !== undefined && records.length > 0;
  }

  clear(): void {
    this.listeners.clear();
    this.emitCounts.clear();
  }

  private addListener(event: string, handler: EventHandler, target: unknown, once: boolean): void {
    let records = this.listeners.get(event);
    if (!records) {
      records = [];
      this.listeners.set(event, records);
    }
    const duplicate = records.some(
      (record) => record.handler === handler && record.target === target
    );
    if (duplicate) {
      this.logger.warn(LOGGER_TAG, `重复订阅被忽略: ${event}`);
      return;
    }
    records.push({ handler, target, once });
  }

  private removeListenerRecord(event: string, record: ListenerRecord): void {
    const records = this.listeners.get(event);
    if (!records) {
      return;
    }
    const index = records.indexOf(record);
    if (index >= 0) {
      records.splice(index, 1);
    }
    if (records.length === 0) {
      this.listeners.delete(event);
    }
  }
}
