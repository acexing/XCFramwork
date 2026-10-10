export interface IGameConfig {
  getGameVersion(): string;
  getPlatformName(): string;
  isDebugMode(): boolean;
}
