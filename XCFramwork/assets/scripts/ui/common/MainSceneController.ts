import {
  _decorator,
  Component,
  Node,
  Label,
  Sprite,
  UITransform,
  Vec3,
  Color,
  input,
  Input,
  EventTouch,
  EventMouse,
  tween,
  Button,
} from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IEventBus } from '../../core/interfaces/IEventBus';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { GAME_EVENTS } from '../../core/events/GameEvents';

const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {
  @property({ type: Label, tooltip: '标题文本' })
  public titleLabel: Label | null = null;

  @property({ type: Label, tooltip: '点击计数' })
  public countLabel: Label | null = null;

  @property({ type: Node, tooltip: '可交互对象' })
  public interactiveNode: Node | null = null;

  @property({ type: Button, tooltip: '打开弹窗按钮' })
  public openDialogButton: Button | null = null;

  @property({ type: Button, tooltip: '打开设置按钮' })
  public openSettingsButton: Button | null = null;

  private clickCount: number = 0;
  private eventBus: IEventBus | null = null;

  onLoad(): void {
    try {
      this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
    } catch {
      this.eventBus = null;
    }

    if (this.titleLabel) {
      this.titleLabel.string = 'MVP 技术验证';
    }

    if (this.countLabel) {
      this.countLabel.string = '点击次数: 0';
    }

    this.setupInteractiveNode();
    this.setupButtons();

    if (this.eventBus) {
      this.eventBus.on(GAME_EVENTS.UI_VIEW_OPENED, this.onViewOpened, this);
      this.eventBus.on(GAME_EVENTS.UI_VIEW_CLOSED, this.onViewClosed, this);
    }
  }

  onDestroy(): void {
    if (this.eventBus) {
      this.eventBus.off(GAME_EVENTS.UI_VIEW_OPENED, this.onViewOpened, this);
      this.eventBus.off(GAME_EVENTS.UI_VIEW_CLOSED, this.onViewClosed, this);
    }
  }

  private setupInteractiveNode(): void {
    if (!this.interactiveNode) {
      return;
    }

    this.interactiveNode.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    this.interactiveNode.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
  }

  private setupButtons(): void {
    if (this.openDialogButton) {
      this.openDialogButton.node.on(Button.EventType.CLICK, this.onOpenDialog, this);
    }
    if (this.openSettingsButton) {
      this.openSettingsButton.node.on(Button.EventType.CLICK, this.onOpenSettings, this);
    }
  }

  private onTouchStart(_event: EventTouch): void {
    this.onInteract();
  }

  private onMouseDown(_event: EventMouse): void {
    this.onInteract();
  }

  private onInteract(): void {
    this.clickCount++;

    if (this.countLabel) {
      this.countLabel.string = `点击次数: ${this.clickCount}`;
    }

    if (this.interactiveNode) {
      const scaleUp = tween(this.interactiveNode).to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) });
      const scaleDown = tween(this.interactiveNode).to(0.1, { scale: new Vec3(1, 1, 1) });
      scaleUp.then(scaleDown).start();
    }

    if (this.eventBus) {
      this.eventBus.emit('MVP_INTERACT', { count: this.clickCount });
    }
  }

  private onOpenDialog(): void {
    try {
      const uiManager = ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
      uiManager.open('ConfirmDialog', {
        title: '测试弹窗',
        message: 'MVP 验证弹窗',
        onConfirm: () => {},
      });
    } catch {
      console.warn('[MainSceneController] UIManager 未注册');
    }
  }

  private onOpenSettings(): void {
    try {
      const uiManager = ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
      uiManager.open('SettingsPanel');
    } catch {
      console.warn('[MainSceneController] UIManager 未注册');
    }
  }

  private onViewOpened(data: unknown): void {
    const payload = data as { viewId: string };
    console.log(`[MainSceneController] 视图打开: ${payload.viewId}`);
  }

  private onViewClosed(data: unknown): void {
    const payload = data as { viewId: string };
    console.log(`[MainSceneController] 视图关闭: ${payload.viewId}`);
  }
}
