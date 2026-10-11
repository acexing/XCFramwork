import { director, Director } from 'cc';
import { ITimerManager, TimerHandle } from '../core/interfaces/ITimerManager';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'TimerManager';

interface TimerRecord {
  id: number;
  owner: unknown;
  type: 'delay' | 'interval' | 'countdown';
  callback: (...args: unknown[]) => void;
  intervalMs: number;
  remainingMs: number;
  totalMs: number;
  paused: boolean;
  lastTickTime: number;
}

export class TimerManager implements ITimerManager {
  private logger: ILogger;
  private timers = new Map<number, TimerRecord>();
  private ownerMap = new Map<unknown, number[]>();
  private nextId = 1;
  private tickBound: (() => void) | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.tickBound = this.onTick.bind(this);
    director.on(Director.EVENT_BEFORE_UPDATE, this.tickBound);
  }

  delay(owner: unknown, callback: () => void, ms: number): TimerHandle {
    const record: TimerRecord = {
      id: this.nextId++,
      owner,
      type: 'delay',
      callback: callback as (...args: unknown[]) => void,
      intervalMs: ms,
      remainingMs: ms,
      totalMs: ms,
      paused: false,
      lastTickTime: Date.now(),
    };
    this.addTimer(record);
    return { id: record.id, owner, type: 'delay', paused: false };
  }

  interval(owner: unknown, callback: () => void, ms: number): TimerHandle {
    const record: TimerRecord = {
      id: this.nextId++,
      owner,
      type: 'interval',
      callback: callback as (...args: unknown[]) => void,
      intervalMs: ms,
      remainingMs: ms,
      totalMs: ms,
      paused: false,
      lastTickTime: Date.now(),
    };
    this.addTimer(record);
    return { id: record.id, owner, type: 'interval', paused: false };
  }

  countdown(
    owner: unknown,
    callback: (remaining: number) => void,
    totalMs: number,
    tickMs: number = 1000
  ): TimerHandle {
    const record: TimerRecord = {
      id: this.nextId++,
      owner,
      type: 'countdown',
      callback: callback as (...args: unknown[]) => void,
      intervalMs: tickMs,
      remainingMs: totalMs,
      totalMs,
      paused: false,
      lastTickTime: Date.now(),
    };
    this.addTimer(record);
    callback(totalMs);
    return { id: record.id, owner, type: 'countdown', paused: false };
  }

  cancel(handle: TimerHandle): void {
    this.removeTimer(handle.id);
  }

  cancelByOwner(owner: unknown): void {
    const ids = this.ownerMap.get(owner);
    if (ids) {
      for (const id of ids) {
        this.timers.delete(id);
      }
      this.ownerMap.delete(owner);
    }
  }

  pause(handle: TimerHandle): void {
    const record = this.timers.get(handle.id);
    if (record) {
      record.paused = true;
      handle.paused = true;
    }
  }

  resume(handle: TimerHandle): void {
    const record = this.timers.get(handle.id);
    if (record) {
      record.paused = false;
      record.lastTickTime = Date.now();
      handle.paused = false;
    }
  }

  pauseByOwner(owner: unknown): void {
    const ids = this.ownerMap.get(owner);
    if (ids) {
      for (const id of ids) {
        const record = this.timers.get(id);
        if (record) {
          record.paused = true;
        }
      }
    }
  }

  resumeByOwner(owner: unknown): void {
    const ids = this.ownerMap.get(owner);
    if (ids) {
      for (const id of ids) {
        const record = this.timers.get(id);
        if (record) {
          record.paused = false;
          record.lastTickTime = Date.now();
        }
      }
    }
  }

  getActiveCount(): number {
    return this.timers.size;
  }

  private addTimer(record: TimerRecord): void {
    this.timers.set(record.id, record);
    const ids = this.ownerMap.get(record.owner);
    if (ids) {
      ids.push(record.id);
    } else {
      this.ownerMap.set(record.owner, [record.id]);
    }
  }

  private removeTimer(id: number): void {
    const record = this.timers.get(id);
    if (record) {
      this.timers.delete(id);
      const ids = this.ownerMap.get(record.owner);
      if (ids) {
        const index = ids.indexOf(id);
        if (index >= 0) {
          ids.splice(index, 1);
        }
        if (ids.length === 0) {
          this.ownerMap.delete(record.owner);
        }
      }
    }
  }

  private onTick(): void {
    const now = Date.now();
    const toDelete: number[] = [];

    for (const [id, record] of Array.from(this.timers.entries())) {
      if (record.paused) {
        continue;
      }

      const elapsed = now - record.lastTickTime;
      if (elapsed <= 0) {
        continue;
      }

      record.remainingMs -= elapsed;
      record.lastTickTime = now;

      if (record.type === 'delay') {
        if (record.remainingMs <= 0) {
          record.callback();
          toDelete.push(id);
        }
      } else if (record.type === 'interval') {
        if (record.remainingMs <= 0) {
          record.callback();
          record.remainingMs = record.intervalMs;
        }
      } else if (record.type === 'countdown') {
        if (record.remainingMs <= 0) {
          record.callback(0);
          toDelete.push(id);
        } else if (record.totalMs - record.remainingMs >= record.intervalMs) {
          record.callback(record.remainingMs);
          record.intervalMs += record.intervalMs;
        }
      }
    }

    for (const id of toDelete) {
      this.removeTimer(id);
    }
  }
}
