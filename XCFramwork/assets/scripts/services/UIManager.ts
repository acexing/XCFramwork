import { instantiate, JsonAsset, Node, director, Layout } from 'cc';
import { DEBUG } from 'cc/env';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import { IUIManager, UIOpenOptions, UIType, ViewConfig } from '../core/interfaces/IUIManager';
import { GAME_EVENTS } from '../core/events/GameEvents';
import { UIViewClosedPayload, UIViewOpenedPayload } from '../core/events/EventPayloads';
import { IEventBus } from '../core/interfaces/IEventBus';
import { IAssetService } from '../core/interfaces/IAssetService';
import { ILogger } from '../core/interfaces/ILogger';
import { BaseView } from '../ui/common/BaseView';
import { ServiceRegistry } from '../app/ServiceRegistry';

const LOGGER_TAG = 'UIManager';

const LOADING_VIEW_ID = 'LoadingMask';
const DEFAULT_TOAST_DURATION_MS = 2000;

interface LayerDef {
  name: string;
  zIndex: number;
}

const LAYER_DEFS: LayerDef[] = [
  { name: 'BackgroundLayer', zIndex: 0 },
  { name: 'PageLayer', zIndex: 10 },
  { name: 'DialogLayer', zIndex: 20 },
  { name: 'ToastLayer', zIndex: 30 },
  { name: 'LoadingLayer', zIndex: 40 },
  { name: 'SystemLayer', zIndex: 50 },
];

const UTYPE_TO_LAYER: Record<UIType, string> = {
  [UIType.FullScreen]: 'PageLayer',
  [UIType.Dialog]: 'DialogLayer',
  [UIType.Toast]: 'ToastLayer',
  [UIType.Loading]: 'LoadingLayer',
  [UIType.System]: 'SystemLayer',
};

interface ViewRecord {
  viewId: string;
  node: Node;
  view: BaseView | null;
  type: UIType;
  cache: boolean;
}

export class UIManager implements IUIManager {
  private logger: ILogger;
  private eventBus: IEventBus | null = null;
  private assetService: IAssetService | null = null;
  private layers = new Map<string, Node>();
  private views = new Map<string, ViewRecord>();
  private viewCache = new Map<string, Node>();
  private viewConfigs = new Map<string, ViewConfig>();
  private ready = false;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async init(): Promise<void> {
    this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
    this.assetService = ServiceRegistry.get<IAssetService>(SERVICE_TOKENS.ASSET_SERVICE);
    await this.loadViewConfigs();
    const canvas = this.findUICanvas();
    this.createLayers(canvas);
    this.ready = true;
    this.logger.info(LOGGER_TAG, `UIManager 初始化完成，视图配置 ${this.viewConfigs.size} 条`);
  }

  async open(viewId: string, data?: unknown, options?: UIOpenOptions): Promise<BaseView> {
    if (!this.ready) {
      throw new Error('[UIManager] 尚未初始化');
    }
    const existing = this.views.get(viewId);
    if (existing) {
      this.logger.debug(LOGGER_TAG, `视图已打开，复用实例: ${viewId}`);
      return existing.view as BaseView;
    }

    const config = this.viewConfigs.get(viewId);
    if (!config) {
      this.logger.error(LOGGER_TAG, `视图未配置: ${viewId}`);
      throw new Error(`视图未配置: ${viewId}`);
    }

    const type = options?.type ?? config.type;
    const cache = options?.cache ?? config.cache;
    const layerName = UTYPE_TO_LAYER[type];
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`UI 层不存在: ${layerName}`);
    }

    if (options?.exclusive) {
      this.closeLayer(layerName, viewId);
    }

    const prefab = await this.assetService!.loadPrefab(config.bundle, config.prefab);
    const node = instantiate(prefab);

    const view = node.getComponent(BaseView);
    if (!view) {
      this.logger.error(LOGGER_TAG, `Prefab 根节点缺少 BaseView 组件: ${viewId}`);
      node.destroy();
      throw new Error(`Prefab 根节点缺少 BaseView 组件: ${viewId}`);
    }

    const record: ViewRecord = { viewId, node, view, type, cache };
    this.views.set(viewId, record);
    layer.addChild(node);
    node.setSiblingIndex(options?.priority ?? layer.children.length - 1);

    view.setupView(viewId, data);
    await view.onOpen(data);

    const payload: UIViewOpenedPayload = { viewId, type: UIType[type] };
    this.eventBus!.emit(GAME_EVENTS.UI_VIEW_OPENED, payload);
    this.logger.info(LOGGER_TAG, `打开视图: ${viewId} 层级: ${layerName}`);
    return view;
  }

  close(viewId: string): void {
    const record = this.views.get(viewId);
    if (!record) {
      this.logger.debug(LOGGER_TAG, `关闭视图，未打开: ${viewId}`);
      return;
    }
    this.views.delete(viewId);
    record.view?.onClose();
    if (record.cache) {
      record.node.active = false;
      record.node.removeFromParent();
      this.viewCache.set(viewId, record.node);
    } else {
      record.node.destroy();
    }
    const payload: UIViewClosedPayload = { viewId };
    this.eventBus!.emit(GAME_EVENTS.UI_VIEW_CLOSED, payload);
    this.logger.info(LOGGER_TAG, `关闭视图: ${viewId} 缓存: ${record.cache}`);
  }

  closeAll(excludeSystem = true): void {
    for (const viewId of Array.from(this.views.keys())) {
      if (excludeSystem && this.views.get(viewId)?.type === UIType.System) {
        continue;
      }
      this.close(viewId);
    }
  }

  get<T extends BaseView>(viewId: string): T | null {
    const record = this.views.get(viewId);
    return (record?.view as T) ?? null;
  }

  isOpen(viewId: string): boolean {
    return this.views.has(viewId);
  }

  showLoading(text?: string): void {
    const record = this.views.get(LOADING_VIEW_ID);
    if (record) {
      record.node.emit('update-loading-text', text ?? '');
      return;
    }
    void this.open(LOADING_VIEW_ID, { text: text ?? '' });
  }

  hideLoading(): void {
    this.close(LOADING_VIEW_ID);
  }

  showToast(text: string, duration: number = DEFAULT_TOAST_DURATION_MS): void {
    void this.open('ToastMessage', { text, duration }, { exclusive: false });
  }

  private closeLayer(layerName: string, excludeViewId: string): void {
    for (const [viewId, record] of Array.from(this.views.entries())) {
      if (viewId === excludeViewId) {
        continue;
      }
      if (UTYPE_TO_LAYER[record.type] === layerName) {
        this.close(viewId);
      }
    }
  }

  private findUICanvas(): Node {
    const scene = director.getScene();
    if (!scene) {
      throw new Error('[UIManager] 当前无活动场景');
    }
    const canvas = scene.getChildByName('Canvas');
    if (!canvas && DEBUG) {
      this.logger.warn(LOGGER_TAG, '场景中未找到 Canvas 节点，UI 层级挂在场景根节点');
    }
    return canvas ?? scene;
  }

  private createLayers(parent: Node): void {
    for (const def of LAYER_DEFS) {
      let layer = parent.getChildByName(def.name);
      if (!layer) {
        layer = new Node(def.name);
        parent.addChild(layer);
        if (def.name === 'ToastLayer') {
          const layout = layer.addComponent(Layout);
          layout.type = Layout.Type.VERTICAL;
          layout.resizeMode = Layout.ResizeMode.CONTAINER;
          layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
          layout.paddingTop = 120;
          layout.spacingY = 10;
        }
        this.logger.debug(LOGGER_TAG, `创建 UI 层: ${def.name} zIndex=${def.zIndex}`);
      }
      layer.setSiblingIndex(def.zIndex);
      this.layers.set(def.name, layer);
    }
  }

  private async loadViewConfigs(): Promise<void> {
    const json = await this.assetService!.loadJson('resources', 'config/views');
    const data = json.json as { views?: ViewConfig[] };
    if (!data?.views) {
      this.logger.warn(LOGGER_TAG, '视图配置为空: config/views');
      return;
    }
    for (const config of data.views) {
      this.viewConfigs.set(config.id, config);
    }
  }
}
