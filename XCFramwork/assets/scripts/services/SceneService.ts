import { director } from 'cc';
import { DEBUG } from 'cc/env';
import {
  ISceneService,
  SceneData,
  SceneHookCallback,
  SceneHookType,
  SceneName,
} from '../core/interfaces/ISceneService';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'SceneService';
const DEFAULT_SWITCH_COOLDOWN_MS = 500;

export class SceneService implements ISceneService {
  private logger: ILogger;
  private currentScene: SceneName;
  private isSwitching = false;
  private lastSwitchTime = 0;
  private switchCooldown = DEFAULT_SWITCH_COOLDOWN_MS;
  private hooks = new Map<SceneName, Map<SceneHookType, SceneHookCallback[]>>();
  private pendingScene: SceneName | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.currentScene = 'Boot';
    for (const scene of ['Boot', 'Loading', 'Main'] as SceneName[]) {
      this.hooks.set(scene, new Map());
    }
  }

  async goto(sceneName: SceneName, data?: SceneData): Promise<void> {
    if (!this.canSwitch(sceneName)) {
      this.logger.debug(
        LOGGER_TAG,
        `拒绝切换: 当前=${this.currentScene} 目标=${sceneName} 正在切换中或处于冷却期`
      );
      return;
    }

    this.isSwitching = true;
    this.pendingScene = sceneName;
    const previousScene = this.currentScene;

    try {
      await this.executeHooks(previousScene, 'beforeLeave', data);
      await this.executeHooks(sceneName, 'beforeEnter', data);

      const loaded = await this.loadScene(sceneName);
      if (!loaded) {
        throw new Error(`场景加载失败: ${sceneName}`);
      }

      this.currentScene = sceneName;
      this.lastSwitchTime = Date.now();
      this.logger.info(LOGGER_TAG, `切换到场景 ${sceneName}`);

      await this.executeHooks(sceneName, 'afterEnter', data);
      await this.executeHooks(previousScene, 'afterLeave', data);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `场景切换失败: 目标=${sceneName}`, error);
      if (sceneName !== 'Boot') {
        await this.rollbackToBoot();
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      this.isSwitching = false;
      this.pendingScene = null;
    }
  }

  getCurrentScene(): SceneName {
    return this.currentScene;
  }

  registerHook(sceneName: SceneName, hookType: SceneHookType, callback: SceneHookCallback): void {
    const sceneHooks = this.hooks.get(sceneName);
    if (!sceneHooks) {
      this.logger.warn(LOGGER_TAG, `注册钩子失败，未知场景: ${sceneName}`);
      return;
    }
    let typeHooks = sceneHooks.get(hookType);
    if (!typeHooks) {
      typeHooks = [];
      sceneHooks.set(hookType, typeHooks);
    }
    if (typeHooks.indexOf(callback) >= 0) {
      if (DEBUG) {
        this.logger.warn(LOGGER_TAG, `钩子重复注册: ${sceneName}/${hookType}`);
      }
      return;
    }
    typeHooks.push(callback);
  }

  unregisterHook(sceneName: SceneName, hookType: SceneHookType, callback: SceneHookCallback): void {
    const typeHooks = this.hooks.get(sceneName)?.get(hookType);
    if (!typeHooks) {
      return;
    }
    const index = typeHooks.indexOf(callback);
    if (index >= 0) {
      typeHooks.splice(index, 1);
    }
  }

  private canSwitch(sceneName: SceneName): boolean {
    if (this.isSwitching) {
      return false;
    }
    if (sceneName === this.currentScene && Date.now() - this.lastSwitchTime < this.switchCooldown) {
      return false;
    }
    return true;
  }

  private loadScene(sceneName: SceneName): Promise<boolean> {
    return new Promise((resolve) => {
      director.loadScene(sceneName, (error) => {
        if (error) {
          this.logger.error(LOGGER_TAG, `director.loadScene 失败: ${sceneName}`, error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  private async rollbackToBoot(): Promise<void> {
    this.logger.warn(LOGGER_TAG, '回退到安全场景 Boot');
    this.isSwitching = true;
    try {
      const loaded = await this.loadScene('Boot');
      if (loaded) {
        this.currentScene = 'Boot';
        this.lastSwitchTime = Date.now();
      }
    } finally {
      this.isSwitching = false;
    }
  }

  private async executeHooks(
    sceneName: SceneName,
    hookType: SceneHookType,
    data?: SceneData
  ): Promise<void> {
    const typeHooks = this.hooks.get(sceneName)?.get(hookType);
    if (!typeHooks || typeHooks.length === 0) {
      return;
    }
    for (const callback of [...typeHooks]) {
      try {
        await callback(data);
      } catch (error) {
        this.logger.warn(LOGGER_TAG, `钩子执行异常: ${sceneName}/${hookType}`, error);
      }
    }
  }
}
