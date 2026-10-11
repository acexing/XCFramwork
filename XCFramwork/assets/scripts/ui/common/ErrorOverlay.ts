import { _decorator, Component, Node, Label, UITransform, Widget, Color, view } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { ILogger } from '../../core/interfaces/ILogger';
import { ServiceRegistry } from '../../app/ServiceRegistry';

const { ccclass, property } = _decorator;

@ccclass('ErrorOverlay')
export class ErrorOverlay extends Component {
  @property({ type: Label, tooltip: '错误标题' })
  public titleLabel: Label | null = null;

  @property({ type: Label, tooltip: '错误详情' })
  public detailLabel: Label | null = null;

  @property({ type: Node, tooltip: '重试按钮' })
  public retryButton: Node | null = null;

  private logger: ILogger | null = null;

  onLoad(): void {
    this.logger = ServiceRegistry.get<ILogger>(SERVICE_TOKENS.LOGGER);

    this.node.active = false;

    if (this.retryButton) {
      this.retryButton.on(Node.EventType.TOUCH_END, this.onRetry, this);
    }
  }

  onDestroy(): void {
    if (this.retryButton) {
      this.retryButton.off(Node.EventType.TOUCH_END, this.onRetry, this);
    }
  }

  public showError(title: string, detail: string): void {
    this.node.active = true;

    if (this.titleLabel) {
      this.titleLabel.string = title;
      this.titleLabel.color = new Color(255, 80, 80, 255);
    }

    if (this.detailLabel) {
      this.detailLabel.string = detail;
    }

    if (this.logger) {
      this.logger.error('ErrorOverlay', `${title}: ${detail}`);
    }
  }

  public hide(): void {
    this.node.active = false;
  }

  private onRetry(): void {
    this.hide();
  }
}
