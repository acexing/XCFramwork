import { _decorator, Component, Label, Button } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { ITimerManager, TimerHandle } from '../scripts/core/interfaces/ITimerManager';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

/**
 * 示例6: TimerManager 定时器使用演示
 *
 * 本示例展示如何使用框架的 TimerManager 进行定时任务管理：
 * - delay(): 延迟执行一次
 * - interval(): 循环执行
 * - countdown(): 倒计时（带回调通知剩余时间）
 * - cancel(): 取消指定定时器
 * - cancelByOwner(): 取消某对象的所有定时器
 * - pause() / resume(): 暂停/恢复定时器
 * - pauseByOwner() / resumeByOwner(): 按对象暂停/恢复
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 UI 组件
 * 3. 运行场景，点击按钮演示定时器功能
 */
@ccclass('ExampleTimerManager')
export class ExampleTimerManager extends Component {
  @property({ type: Label, tooltip: '定时器状态显示' })
  public statusLabel: Label | null = null;

  @property({ type: Button, tooltip: '启动延迟定时器按钮' })
  public delayButton: Button | null = null;

  @property({ type: Button, tooltip: '启动循环定时器按钮' })
  public intervalButton: Button | null = null;

  @property({ type: Button, tooltip: '启动倒计时按钮' })
  public countdownButton: Button | null = null;

  @property({ type: Button, tooltip: '取消所有定时器按钮' })
  public cancelButton: Button | null = null;

  private timerManager: ITimerManager | null = null;
  private intervalHandle: TimerHandle | null = null;
  private countdownHandle: TimerHandle | null = null;
  private intervalCount: number = 0;

  onLoad(): void {
    try {
      this.timerManager = ServiceRegistry.get<ITimerManager>(SERVICE_TOKENS.TIMER_MANAGER);
    } catch {
      this.timerManager = null;
      this.log('TimerManager 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.setupButtons();
    this.log(`TimerManager 就绪，活跃定时器: ${this.timerManager.getActiveCount()}`);
  }

  onDestroy(): void {
    // 组件销毁时取消所有由 this 拥有的定时器
    if (this.timerManager) {
      this.timerManager.cancelByOwner(this);
    }
    this.offButtonClick(this.delayButton, this.onDelay);
    this.offButtonClick(this.intervalButton, this.onInterval);
    this.offButtonClick(this.countdownButton, this.onCountdown);
    this.offButtonClick(this.cancelButton, this.onCancelAll);
  }

  private setupButtons(): void {
    this.onButtonClick(this.delayButton, this.onDelay);
    this.onButtonClick(this.intervalButton, this.onInterval);
    this.onButtonClick(this.countdownButton, this.onCountdown);
    this.onButtonClick(this.cancelButton, this.onCancelAll);
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

  /**
   * 延迟定时器：3 秒后执行一次
   */
  private onDelay(): void {
    if (!this.timerManager) {
      return;
    }

    this.log('启动延迟定时器（3秒）');
    this.timerManager.delay(
      this,
      () => {
        this.log('延迟定时器触发！');
      },
      3000
    );
  }

  /**
   * 循环定时器：每秒执行一次
   */
  private onInterval(): void {
    if (!this.timerManager) {
      return;
    }

    if (this.intervalHandle) {
      this.log('循环定时器已在运行');
      return;
    }

    this.intervalCount = 0;
    this.intervalHandle = this.timerManager.interval(
      this,
      () => {
        this.intervalCount++;
        this.log(`循环定时器第 ${this.intervalCount} 次触发`);
      },
      1000
    );
    this.log('启动循环定时器（每1秒）');
  }

  /**
   * 倒计时：10 秒倒计时，每秒回调剩余时间
   */
  private onCountdown(): void {
    if (!this.timerManager) {
      return;
    }

    if (this.countdownHandle) {
      this.log('倒计时已在运行');
      return;
    }

    this.log('启动倒计时（10秒）');
    this.countdownHandle = this.timerManager.countdown(
      this,
      (remaining: number) => {
        if (remaining > 0) {
          this.log(`倒计时剩余: ${remaining}ms`);
        } else {
          this.log('倒计时结束！');
          this.countdownHandle = null;
        }
      },
      10000,
      1000
    );
  }

  /**
   * 取消所有定时器
   */
  private onCancelAll(): void {
    if (!this.timerManager) {
      return;
    }

    this.timerManager.cancelByOwner(this);
    this.intervalHandle = null;
    this.countdownHandle = null;
    this.intervalCount = 0;
    this.log('已取消所有定时器');
  }

  private log(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(`[ExampleTimerManager] ${message}`);
  }
}
