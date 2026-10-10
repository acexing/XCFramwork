export interface IGameBootstrap {
  run(): Promise<void>;
  getInitProgress(): number;
  isReady(): boolean;
}

export interface InitStep {
  name: string;
  weight: number;
  execute: () => Promise<void>;
  isCritical: boolean;
}
