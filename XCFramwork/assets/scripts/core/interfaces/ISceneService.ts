export type SceneName = 'Boot' | 'Loading' | 'Main';

export interface SceneData {
  [key: string]: unknown;
}

export type SceneHookType = 'beforeEnter' | 'afterEnter' | 'beforeLeave' | 'afterLeave';

export type SceneHookCallback = (data?: SceneData) => void | Promise<void>;

export interface ISceneService {
  goto(sceneName: SceneName, data?: SceneData): Promise<void>;
  getCurrentScene(): SceneName;
  registerHook(sceneName: SceneName, hookType: SceneHookType, callback: SceneHookCallback): void;
  unregisterHook(sceneName: SceneName, hookType: SceneHookType, callback: SceneHookCallback): void;
}
