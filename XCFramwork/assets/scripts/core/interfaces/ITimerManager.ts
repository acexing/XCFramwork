export interface TimerHandle {
  id: number;
  owner: unknown;
  type: 'delay' | 'interval' | 'countdown';
  paused: boolean;
}

export interface ITimerManager {
  delay(owner: unknown, callback: () => void, ms: number): TimerHandle;
  interval(owner: unknown, callback: () => void, ms: number): TimerHandle;
  countdown(
    owner: unknown,
    callback: (remaining: number) => void,
    totalMs: number,
    tickMs?: number
  ): TimerHandle;
  cancel(handle: TimerHandle): void;
  cancelByOwner(owner: unknown): void;
  pause(handle: TimerHandle): void;
  resume(handle: TimerHandle): void;
  pauseByOwner(owner: unknown): void;
  resumeByOwner(owner: unknown): void;
  getActiveCount(): number;
}
