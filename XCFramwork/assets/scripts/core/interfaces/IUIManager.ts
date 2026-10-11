import type { BaseView } from '../../ui/common/BaseView';

export enum UIType {
  FullScreen = 0,
  Dialog = 1,
  Toast = 2,
  Loading = 3,
  System = 4,
}

export interface UIOpenOptions {
  type?: UIType;
  priority?: number;
  exclusive?: boolean;
  cache?: boolean;
}

export interface ViewConfig {
  id: string;
  prefab: string;
  bundle: string;
  type: UIType;
  cache: boolean;
}

export interface IUIManager {
  init(): Promise<void>;
  open(viewId: string, data?: unknown, options?: UIOpenOptions): Promise<BaseView>;
  close(viewId: string): void;
  closeAll(excludeSystem?: boolean): void;
  get<T extends BaseView>(viewId: string): T | null;
  isOpen(viewId: string): boolean;
  showLoading(text?: string): void;
  hideLoading(): void;
  showToast(text: string, duration?: number): void;
}
