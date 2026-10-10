import { DEBUG } from 'cc/env';
import { SERVICE_TOKENS, ServiceToken } from '../core/interfaces/ServiceTokens';
import { IGameConfig } from '../core/interfaces/IGameConfig';
import { IPlatformService } from '../core/interfaces/IPlatformService';
import { ServiceRegistry } from './ServiceRegistry';

export const GAME_VERSION = '0.1.0';

export class GameConfig implements IGameConfig {
  private gameVersion: string;
  private debugMode: boolean;

  constructor(debugMode: boolean = DEBUG) {
    this.gameVersion = GAME_VERSION;
    this.debugMode = debugMode;
  }

  getGameVersion(): string {
    return this.gameVersion;
  }

  getPlatformName(): string {
    const token: ServiceToken = SERVICE_TOKENS.PLATFORM_SERVICE;
    if (!ServiceRegistry.has(token)) {
      return 'unknown';
    }
    return ServiceRegistry.get<IPlatformService>(token).getPlatformName();
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }
}
