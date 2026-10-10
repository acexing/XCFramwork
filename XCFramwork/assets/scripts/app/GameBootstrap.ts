import { _decorator, Component } from 'cc';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import { IGameBootstrap, InitStep } from '../core/interfaces/IGameBootstrap';
import { IGameConfig } from '../core/interfaces/IGameConfig';
import { ErrorContext } from '../core/interfaces/IErrorHandler';
import { ISceneService } from '../core/interfaces/ISceneService';
import { Logger } from '../core/logger/Logger';
import { ErrorHandler } from '../core/errors/ErrorHandler';
import { GameConfig } from './GameConfig';
import { PlatformService } from '../platform/PlatformService';
import { SceneService } from '../services/SceneService';
import { ServiceRegistry } from './ServiceRegistry';

const { ccclass } = _decorator;

const LOGGER_TAG = 'GameBootstrap';

@ccclass('GameBootstrap')
export class GameBootstrap extends Component implements IGameBootstrap {
  private logger: Logger = new Logger();
  private errorHandler: ErrorHandler = new ErrorHandler(this.logger);
  private steps: InitStep[] = [];
  private completedWeight = 0;
  private totalWeight = 0;
  private ready = false;
  private started = false;

  async onLoad(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    ServiceRegistry.register(SERVICE_TOKENS.LOGGER, this.logger);
    ServiceRegistry.register(SERVICE_TOKENS.ERROR_HANDLER, this.errorHandler);
    this.buildSteps();
    await this.run();
  }

  async run(): Promise<void> {
    for (const step of this.steps) {
      try {
        this.logger.info(LOGGER_TAG, `开始初始化: ${step.name}`);
        await step.execute();
      } catch (error) {
        const context: ErrorContext = {
          module: 'GameBootstrap',
          operation: step.name,
          version: this.getGameVersionSafe(),
        };
        this.errorHandler.handle(
          error instanceof Error ? error : new Error(String(error)),
          context
        );
        if (step.isCritical) {
          this.onInitFailed(step.name, error);
          return;
        }
        this.logger.warn(LOGGER_TAG, `非关键步骤失败，跳过: ${step.name}`);
      }
      this.completedWeight += step.weight;
      this.logger.debug(LOGGER_TAG, `初始化进度: ${this.getInitProgress().toFixed(2)}`);
    }

    this.ready = true;
    this.logger.info(LOGGER_TAG, '初始化完成，进入主场景');
    await this.enterMainScene();
  }

  getInitProgress(): number {
    if (this.totalWeight === 0) {
      return 0;
    }
    return Math.min(1, this.completedWeight / this.totalWeight);
  }

  isReady(): boolean {
    return this.ready;
  }

  private buildSteps(): void {
    const gameConfig = new GameConfig();
    const platformService = new PlatformService();
    const sceneService = new SceneService(this.logger);

    this.steps = [
      {
        name: 'ErrorHandler',
        weight: 5,
        isCritical: true,
        execute: async () => {
          this.errorHandler.registerGlobalCapture();
          ServiceRegistry.register(SERVICE_TOKENS.ERROR_HANDLER, this.errorHandler);
        },
      },
      {
        name: 'GameConfig',
        weight: 5,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.GAME_CONFIG, gameConfig);
          this.logger.info(
            LOGGER_TAG,
            `游戏版本: ${gameConfig.getGameVersion()} 平台: ${gameConfig.getPlatformName()}`
          );
        },
      },
      {
        name: 'PlatformService',
        weight: 5,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.PLATFORM_SERVICE, platformService);
        },
      },
      {
        name: 'SceneService',
        weight: 10,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.SCENE_SERVICE, sceneService);
        },
      },
    ];

    this.totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);
  }

  private getGameVersionSafe(): string {
    try {
      return ServiceRegistry.get<IGameConfig>(SERVICE_TOKENS.GAME_CONFIG).getGameVersion();
    } catch {
      return 'unknown';
    }
  }

  private onInitFailed(stepName: string, error: unknown): void {
    this.logger.error(LOGGER_TAG, `关键初始化步骤失败，启动中止: ${stepName}`, error);
  }

  private async enterMainScene(): Promise<void> {
    try {
      const sceneService = ServiceRegistry.get<ISceneService>(SERVICE_TOKENS.SCENE_SERVICE);
      await sceneService.goto('Main');
    } catch (error) {
      this.logger.error(LOGGER_TAG, '进入主场景失败', error);
    }
  }
}
