import { _decorator, Component, Node, Label, UITransform, Widget, Color, view, director } from 'cc';
import { DEBUG } from 'cc/env';
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
import { EventBus } from '../services/EventBus';
import { AssetService } from '../services/AssetService';
import { UIManager } from '../services/UIManager';
import { AudioManager } from '../services/AudioManager';
import { SaveService } from '../services/SaveService';
import { ConfigService } from '../services/ConfigService';
import { TimerManager } from '../services/TimerManager';
import { PoolManager } from '../services/PoolManager';
import { LocalizationService } from '../services/LocalizationService';
import { HotUpdateService } from '../services/HotUpdateService';
import { HotUpdateConfig } from '../core/interfaces/IHotUpdateService';

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
    const eventBus = new EventBus(this.logger);
    const assetService = new AssetService(this.logger);
    const uiManager = new UIManager(this.logger);
    const audioManager = new AudioManager(this.logger);
    const storageAdapter = platformService.getStorageAdapter();
    const saveService = new SaveService(this.logger, storageAdapter);
    const configService = new ConfigService(this.logger);
    const timerManager = new TimerManager(this.logger);
    const poolManager = new PoolManager(this.logger);
    const localizationService = new LocalizationService(this.logger);
    const hotUpdateService = new HotUpdateService(this.logger);

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
      {
        name: 'EventBus',
        weight: 5,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.EVENT_BUS, eventBus);
        },
      },
      {
        name: 'AssetService',
        weight: 10,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.ASSET_SERVICE, assetService);
        },
      },
      {
        name: 'UIManager',
        weight: 5,
        isCritical: true,
        execute: async () => {
          await uiManager.init();
          ServiceRegistry.register(SERVICE_TOKENS.UI_MANAGER, uiManager);
        },
      },
      {
        name: 'AudioManager',
        weight: 5,
        isCritical: false,
        execute: async () => {
          await audioManager.init();
          ServiceRegistry.register(SERVICE_TOKENS.AUDIO_MANAGER, audioManager);
        },
      },
      {
        name: 'SaveService',
        weight: 5,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.SAVE_SERVICE, saveService);
        },
      },
      {
        name: 'ConfigService',
        weight: 10,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.CONFIG_SERVICE, configService);
        },
      },
      {
        name: 'TimerManager',
        weight: 5,
        isCritical: true,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.TIMER_MANAGER, timerManager);
        },
      },
      {
        name: 'PoolManager',
        weight: 5,
        isCritical: false,
        execute: async () => {
          ServiceRegistry.register(SERVICE_TOKENS.POOL_MANAGER, poolManager);
        },
      },
      {
        name: 'LocalizationService',
        weight: 10,
        isCritical: true,
        execute: async () => {
          await localizationService.init();
          ServiceRegistry.register(SERVICE_TOKENS.LOCALIZATION_SERVICE, localizationService);
        },
      },
      {
        name: 'HotUpdateService',
        weight: 5,
        isCritical: false,
        execute: async () => {
          const hotUpdateAdapter = platformService.getHotUpdateAdapter();
          hotUpdateService.setAdapter(hotUpdateAdapter);
          const hotUpdateConfig: HotUpdateConfig = {
            manifestUrl: 'https://cdn.example.com/hotupdate/project.manifest',
            versionUrl: 'https://cdn.example.com/hotupdate/version.manifest',
            storagePath: 'hotupdate/',
            timeoutMs: 5000,
            maxRetry: 3,
            checkOnStartup: false,
          };
          await hotUpdateService.init(hotUpdateConfig);
          ServiceRegistry.register(SERVICE_TOKENS.HOT_UPDATE_SERVICE, hotUpdateService);
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
    this.showErrorOverlay(stepName, error);
  }

  private showErrorOverlay(stepName: string, error: unknown): void {
    const scene = director.getScene();
    if (!scene) {
      return;
    }

    const canvas = scene.getChildByName('Canvas') ?? scene;

    const overlayNode = new Node('ErrorOverlay');
    canvas.addChild(overlayNode);

    const transform = overlayNode.addComponent(UITransform);
    transform.setContentSize(view.getVisibleSize().width, view.getVisibleSize().height);

    const widget = overlayNode.addComponent(Widget);
    widget.isAlignTop = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.isAlignBottom = true;

    const titleNode = new Node('ErrorTitle');
    overlayNode.addChild(titleNode);
    const titleLabel = titleNode.addComponent(Label);
    titleLabel.fontSize = 24;
    titleLabel.color = new Color(255, 80, 80, 255);
    titleLabel.string = `初始化失败: ${stepName}`;

    const detailNode = new Node('ErrorDetail');
    overlayNode.addChild(detailNode);
    const detailLabel = detailNode.addComponent(Label);
    detailLabel.fontSize = 14;
    detailLabel.color = new Color(200, 200, 200, 255);
    detailLabel.string = error instanceof Error ? error.message : String(error);
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
