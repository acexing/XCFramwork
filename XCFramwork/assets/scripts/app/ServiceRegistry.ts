import { DEBUG } from 'cc/env';
import { ServiceToken } from '../core/interfaces/ServiceTokens';

export class ServiceRegistry {
  private static services = new Map<string, unknown>();

  static register<T>(token: ServiceToken, instance: T): void {
    if (this.services.has(token)) {
      if (DEBUG) {
        console.warn(`[ServiceRegistry] 服务重复注册: ${token}`);
      }
      return;
    }
    this.services.set(token, instance);
  }

  static get<T>(token: ServiceToken): T {
    const instance = this.services.get(token);
    if (instance === undefined) {
      throw new Error(`[ServiceRegistry] 服务未注册: ${token}`);
    }
    return instance as T;
  }

  static has(token: ServiceToken): boolean {
    return this.services.has(token);
  }

  static unregister(token: ServiceToken): void {
    this.services.delete(token);
  }

  static clear(): void {
    this.services.clear();
  }
}
