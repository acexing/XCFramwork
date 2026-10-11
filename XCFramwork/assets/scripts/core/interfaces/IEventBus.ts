export type EventHandler<T = unknown> = (data: T) => void;

export interface IEventBus {
  on<T>(event: string, handler: EventHandler<T>, target?: unknown): void;
  once<T>(event: string, handler: EventHandler<T>, target?: unknown): void;
  off(event: string, handler?: EventHandler, target?: unknown): void;
  offByTarget(target: unknown): void;
  emit<T>(event: string, data?: T): void;
  hasListener(event: string): boolean;
  clear(): void;
}
