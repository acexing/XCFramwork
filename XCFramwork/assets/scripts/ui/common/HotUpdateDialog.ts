import { _decorator, Component, Node, Label, ProgressBar, Button } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IHotUpdateService, HotUpdateState } from '../../core/interfaces/IHotUpdateService';
import { ServiceRegistry } from '../../app/ServiceRegistry';

const { ccclass, property } = _decorator;

@ccclass('HotUpdateDialog')
export class HotUpdateDialog extends Component {
  @property({ type: Label, tooltip: '标题' })
  public titleLabel: Label | null = null;

  @property({ type: Label, tooltip: '更新说明' })
  public notesLabel: Label | null = null;

  @property({ type: Label, tooltip: '版本信息' })
  public versionLabel: Label | null = null;

  @property({ type: Label, tooltip: '更新大小' })
  public sizeLabel: Label | null = null;

  @property({ type: Button, tooltip: '立即更新按钮' })
  public updateButton: Button | null = null;

  @property({ type: Button, tooltip: '跳过按钮（非强更时显示）' })
  public skipButton: Button | null = null;

  @property({ type: ProgressBar, tooltip: '下载进度条' })
  public progressBar: ProgressBar | null = null;

  @property({ type: Label, tooltip: '进度百分比' })
  public progressLabel: Label | null = null;

  @property({ type: Label, tooltip: '速度显示' })
  public speedLabel: Label | null = null;

  @property({ type: Button, tooltip: '暂停按钮' })
  public pauseButton: Button | null = null;

  @property({ type: Button, tooltip: '取消按钮' })
  public cancelButton: Button | null = null;

  private hotUpdateService: IHotUpdateService | null = null;
  private stateHandler: ((state: HotUpdateState) => void) | null = null;

  onLoad(): void {
    try {
      this.hotUpdateService = ServiceRegistry.get<IHotUpdateService>(
        SERVICE_TOKENS.HOT_UPDATE_SERVICE
      );
    } catch {
      this.hotUpdateService = null;
    }

    if (this.hotUpdateService) {
      this.stateHandler = (state: HotUpdateState) => {
        this.onStateChanged(state);
      };
      this.hotUpdateService.onStateChange(this.stateHandler);
    }

    this.setupButtons();
    this.hideAllSections();
  }

  onDestroy(): void {
    if (this.hotUpdateService && this.stateHandler) {
      this.hotUpdateService.offStateChange(this.stateHandler);
    }
  }

  public showUpdatePrompt(
    remoteVersion: string,
    localVersion: string,
    updateNotes: string,
    updateSize: number,
    isForceUpdate: boolean
  ): void {
    this.hideAllSections();

    if (this.titleLabel) {
      this.titleLabel.string = isForceUpdate ? '强制更新' : '发现新版本';
    }
    if (this.notesLabel) {
      this.notesLabel.string = updateNotes;
    }
    if (this.versionLabel) {
      this.versionLabel.string = `${localVersion} → ${remoteVersion}`;
    }
    if (this.sizeLabel) {
      this.sizeLabel.string = this.formatSize(updateSize);
    }

    if (this.updateButton?.node) {
      this.updateButton.node.active = true;
    }
    if (this.skipButton?.node) {
      this.skipButton.node.active = !isForceUpdate;
    }
    if (this.progressBar?.node) {
      this.progressBar.node.active = false;
    }
    if (this.progressLabel?.node) {
      this.progressLabel.node.active = false;
    }
    if (this.speedLabel?.node) {
      this.speedLabel.node.active = false;
    }
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = false;
    }
    if (this.cancelButton?.node) {
      this.cancelButton.node.active = false;
    }
  }

  private onStateChanged(state: HotUpdateState): void {
    switch (state) {
      case HotUpdateState.Downloading:
        this.showDownloadingUI();
        break;
      case HotUpdateState.Paused:
        this.showPausedUI();
        break;
      case HotUpdateState.Verifying:
        this.showVerifyingUI();
        break;
      case HotUpdateState.ReadyToRestart:
        this.showReadyToRestartUI();
        break;
      case HotUpdateState.Failed:
        this.showFailedUI();
        break;
      case HotUpdateState.UpToDate:
        this.hideAllSections();
        break;
      default:
        break;
    }
  }

  private showDownloadingUI(): void {
    if (this.progressBar?.node) {
      this.progressBar.node.active = true;
    }
    if (this.progressLabel?.node) {
      this.progressLabel.node.active = true;
    }
    if (this.speedLabel?.node) {
      this.speedLabel.node.active = true;
    }
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = true;
    }
    if (this.cancelButton?.node) {
      this.cancelButton.node.active = true;
    }
    if (this.updateButton?.node) {
      this.updateButton.node.active = false;
    }
    if (this.skipButton?.node) {
      this.skipButton.node.active = false;
    }
  }

  private showPausedUI(): void {
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = false;
    }
  }

  private showVerifyingUI(): void {
    if (this.progressLabel) {
      this.progressLabel.string = '校验文件完整性...';
    }
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = false;
    }
    if (this.cancelButton?.node) {
      this.cancelButton.node.active = false;
    }
  }

  private showReadyToRestartUI(): void {
    if (this.progressLabel) {
      this.progressLabel.string = '更新完成，即将重启';
    }
    if (this.progressBar?.node) {
      this.progressBar.node.active = false;
    }
    if (this.speedLabel?.node) {
      this.speedLabel.node.active = false;
    }
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = false;
    }
    if (this.cancelButton?.node) {
      this.cancelButton.node.active = false;
    }
  }

  private showFailedUI(): void {
    if (this.titleLabel) {
      this.titleLabel.string = '更新失败';
    }
    if (this.progressLabel) {
      this.progressLabel.string = '下载失败，请检查网络';
    }
    if (this.progressBar?.node) {
      this.progressBar.node.active = false;
    }
    if (this.speedLabel?.node) {
      this.speedLabel.node.active = false;
    }
    if (this.pauseButton?.node) {
      this.pauseButton.node.active = false;
    }
    if (this.updateButton?.node) {
      this.updateButton.node.active = true;
    }
  }

  private hideAllSections(): void {
    const nodes = [
      this.progressBar?.node,
      this.progressLabel?.node,
      this.speedLabel?.node,
      this.pauseButton?.node,
      this.cancelButton?.node,
    ];
    for (const node of nodes) {
      if (node) {
        node.active = false;
      }
    }
  }

  private setupButtons(): void {
    if (this.updateButton) {
      this.updateButton.node.on(Button.EventType.CLICK, this.onUpdateClick, this);
    }
    if (this.skipButton) {
      this.skipButton.node.on(Button.EventType.CLICK, this.onSkipClick, this);
    }
    if (this.pauseButton) {
      this.pauseButton.node.on(Button.EventType.CLICK, this.onPauseClick, this);
    }
    if (this.cancelButton) {
      this.cancelButton.node.on(Button.EventType.CLICK, this.onCancelClick, this);
    }
  }

  private onUpdateClick(): void {
    if (this.hotUpdateService) {
      this.hotUpdateService.startUpdate().catch(() => {});
    }
  }

  private onSkipClick(): void {
    this.node.active = false;
  }

  private onPauseClick(): void {
    if (this.hotUpdateService) {
      this.hotUpdateService.pauseUpdate();
    }
  }

  private onCancelClick(): void {
    if (this.hotUpdateService) {
      this.hotUpdateService.cancelUpdate().catch(() => {});
    }
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
    if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return bytes + ' B';
  }
}
