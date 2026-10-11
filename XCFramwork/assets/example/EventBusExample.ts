import { _decorator, Component, Label, Node, Button } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { IEventBus } from '../scripts/core/interfaces/IEventBus';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';
import { GAME_EVENTS } from '../scripts/core/events/GameEvents';

const { ccclass, property } = _decorator;

/**
 * 示例1: EventBus 事件系统使用演示
 *
 * 本示例展示如何使用框架的 EventBus 进行事件通信：
 * - on(): 订阅事件
 * - once(): 订阅一次性事件
 * - off(): 取消订阅
 * - emit(): 发布事件
 * - offByTarget(): 按目标批量取消订阅
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 resultLabel 和 testButton
 * 3. 运行场景，点击按钮触发事件演示
 */
@ccclass('ExampleEventBus')
export class ExampleEventBus extends Component {
  @property({ type: Label, tooltip: '结果显示标签' })
  public resultLabel: Label | null = null;

  @property({ type: Button, tooltip: '触发事件按钮' })
  public testButton: Button | null = null;

  private eventBus: IEventBus | null = null;
  private logLines: string[] = [];

  onLoad(): void {
    try {
      this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
    } catch {
      this.eventBus = null;
      this.log('EventBus 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.subscribeEvents();

    if (this.testButton) {
      this.testButton.node.on(Button.EventType.CLICK, this.onButtonClick, this);
    }
  }

  onDestroy(): void {
    if (this.eventBus) {
      this.eventBus.offByTarget(this);
    }
    if (this.testButton) {
      this.testButton.node.off(Button.EventType.CLICK, this.onButtonClick, this);
    }
  }

  private subscribeEvents(): void {
    if (!this.eventBus) {
      return;
    }

    // 示例1: 使用 on() 订阅自定义事件
    this.eventBus.on(
      'EXAMPLE_CUSTOM_EVENT',
      (data: unknown) => {
        const payload = data as { message: string };
        this.log(`收到自定义事件: ${payload.message}`);
      },
      this
    );

    // 示例2: 使用 once() 订阅一次性事件
    this.eventBus.once(
      'EXAMPLE_ONCE_EVENT',
      () => {
        this.log('一次性事件触发，后续不再接收');
      },
      this
    );

    // 示例3: 订阅框架内置事件
    this.eventBus.on(
      GAME_EVENTS.UI_VIEW_OPENED,
      (data: unknown) => {
        const payload = data as { viewId: string };
        this.log(`UI 视图打开: ${payload.viewId}`);
      },
      this
    );

    this.log('事件订阅完成');
  }

  private onButtonClick(): void {
    if (!this.eventBus) {
      return;
    }

    // 发布自定义事件
    this.eventBus.emit('EXAMPLE_CUSTOM_EVENT', { message: '按钮点击触发' });

    // 发布一次性事件（第二次点击不会再触发）
    this.eventBus.emit('EXAMPLE_ONCE_EVENT');

    this.log('--- 事件已发布 ---');
  }

  private log(message: string): void {
    this.logLines.push(message);
    if (this.logLines.length > 10) {
      this.logLines.shift();
    }
    if (this.resultLabel) {
      this.resultLabel.string = this.logLines.join('\n');
    }
    console.log(`[ExampleEventBus] ${message}`);
  }
}
