import { _decorator, Component, Label, Button } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { IUIManager } from '../scripts/core/interfaces/IUIManager';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

/**
 * 示例2: UIManager 弹窗管理使用演示
 *
 * 本示例展示如何使用框架的 UIManager 打开和关闭弹窗：
 * - open(): 打开一个 UI 视图
 * - close(): 关闭指定视图
 * - closeAll(): 关闭所有视图
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 resultLabel 和按钮
 * 3. 运行场景，点击按钮演示弹窗管理
 *
 * 注意：需要在 views.json 中配置对应的视图才能正常打开
 */
@ccclass('ExampleUIManager')
export class ExampleUIManager extends Component {
  @property({ type: Label, tooltip: '结果显示标签' })
  public resultLabel: Label | null = null;

  @property({ type: Button, tooltip: '打开确认弹窗按钮' })
  public openConfirmButton: Button | null = null;

  @property({ type: Button, tooltip: '打开提示弹窗按钮' })
  public openToastButton: Button | null = null;

  @property({ type: Button, tooltip: '关闭所有弹窗按钮' })
  public closeAllButton: Button | null = null;

  private uiManager: IUIManager | null = null;

  onLoad(): void {
    try {
      this.uiManager = ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
    } catch {
      this.uiManager = null;
      this.log('UIManager 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.setupButtons();
    this.log('UIManager 就绪');
  }

  onDestroy(): void {
    this.offButtonClick(this.openConfirmButton, this.onOpenConfirm);
    this.offButtonClick(this.openToastButton, this.onOpenToast);
    this.offButtonClick(this.closeAllButton, this.onCloseAll);
  }

  private setupButtons(): void {
    this.onButtonClick(this.openConfirmButton, this.onOpenConfirm);
    this.onButtonClick(this.openToastButton, this.onOpenToast);
    this.onButtonClick(this.closeAllButton, this.onCloseAll);
  }

  private onButtonClick(button: Button | null, handler: () => void): void {
    if (button) {
      button.node.on(Button.EventType.CLICK, handler, this);
    }
  }

  private offButtonClick(button: Button | null, handler: () => void): void {
    if (button) {
      button.node.off(Button.EventType.CLICK, handler, this);
    }
  }

  private onOpenConfirm(): void {
    if (!this.uiManager) {
      return;
    }

    // 打开确认弹窗，传入数据
    this.uiManager.open('ConfirmDialog', {
      title: '示例确认弹窗',
      message: '这是通过 UIManager 打开的确认弹窗',
      onConfirm: () => {
        this.log('用户点击了确认');
      },
      onCancel: () => {
        this.log('用户点击了取消');
      },
    });
    this.log('打开 ConfirmDialog');
  }

  private onOpenToast(): void {
    if (!this.uiManager) {
      return;
    }

    // 打开提示消息
    this.uiManager.open('ToastMessage', {
      message: '这是一条提示消息',
      duration: 2000,
    });
    this.log('打开 ToastMessage');
  }

  private onCloseAll(): void {
    if (!this.uiManager) {
      return;
    }

    this.uiManager.closeAll();
    this.log('关闭所有弹窗');
  }

  private log(message: string): void {
    if (this.resultLabel) {
      this.resultLabel.string = message;
    }
    console.log(`[ExampleUIManager] ${message}`);
  }
}
