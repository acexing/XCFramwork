import { _decorator, Component, Label, Button, Node, Sprite, UITransform } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { IPoolManager, PoolInfo } from '../scripts/core/interfaces/IPoolManager';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

interface BulletData {
  damage: number;
  speed: number;
  active: boolean;
}

const POOL_NAME = 'bullet_pool';

/**
 * 示例7: PoolManager 对象池使用演示
 *
 * 本示例展示如何使用框架的 PoolManager 进行对象池管理：
 * - register(): 注册对象池（指定创建函数、重置函数、预创建数量）
 * - get(): 从池中获取对象
 * - release(): 将对象归还到池中
 * - releaseAll(): 释放池中所有对象
 * - getPoolInfo(): 获取池信息（大小、活跃数、总创建数）
 * - clearAll(): 清除所有对象池
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 UI 组件
 * 3. 运行场景，点击按钮演示对象池操作
 */
@ccclass('ExamplePoolManager')
export class ExamplePoolManager extends Component {
  @property({ type: Label, tooltip: '对象池状态显示' })
  public statusLabel: Label | null = null;

  @property({ type: Button, tooltip: '注册对象池按钮' })
  public registerButton: Button | null = null;

  @property({ type: Button, tooltip: '获取对象按钮' })
  public getButton: Button | null = null;

  @property({ type: Button, tooltip: '释放对象按钮' })
  public releaseButton: Button | null = null;

  @property({ type: Button, tooltip: '显示池信息按钮' })
  public infoButton: Button | null = null;

  private poolManager: IPoolManager | null = null;
  private activeBullets: BulletData[] = [];

  onLoad(): void {
    try {
      this.poolManager = ServiceRegistry.get<IPoolManager>(SERVICE_TOKENS.POOL_MANAGER);
    } catch {
      this.poolManager = null;
      this.log('PoolManager 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.setupButtons();
    this.log('PoolManager 就绪');
  }

  onDestroy(): void {
    this.offButtonClick(this.registerButton, this.onRegister);
    this.offButtonClick(this.getButton, this.onGet);
    this.offButtonClick(this.releaseButton, this.onRelease);
    this.offButtonClick(this.infoButton, this.onShowInfo);
  }

  private setupButtons(): void {
    this.onButtonClick(this.registerButton, this.onRegister);
    this.onButtonClick(this.getButton, this.onGet);
    this.onButtonClick(this.releaseButton, this.onRelease);
    this.onButtonClick(this.infoButton, this.onShowInfo);
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
   * 注册对象池
   * - createFn: 创建新对象的函数
   * - resetFn: 对象归还时的重置函数
   * - preloadCount: 预创建数量
   */
  private onRegister(): void {
    if (!this.poolManager) {
      return;
    }

    this.poolManager.register<BulletData>(
      POOL_NAME,
      () => {
        return { damage: 10, speed: 200, active: false };
      },
      (obj: BulletData) => {
        obj.damage = 10;
        obj.speed = 200;
        obj.active = false;
      },
      5
    );

    this.log(`对象池 "${POOL_NAME}" 已注册（预创建5个）`);
  }

  /**
   * 从池中获取对象
   */
  private onGet(): void {
    if (!this.poolManager) {
      return;
    }

    try {
      const bullet = this.poolManager.get<BulletData>(POOL_NAME);
      bullet.active = true;
      bullet.damage = 20;
      this.activeBullets.push(bullet);
      this.log(`获取对象: damage=${bullet.damage}, 活跃数=${this.activeBullets.length}`);
    } catch (error) {
      this.log(`获取失败（请先注册对象池）: ${error}`);
    }
  }

  /**
   * 将对象归还到池中
   */
  private onRelease(): void {
    if (!this.poolManager) {
      return;
    }

    if (this.activeBullets.length === 0) {
      this.log('无活跃对象可释放');
      return;
    }

    const bullet = this.activeBullets.pop();
    if (bullet) {
      this.poolManager.release<BulletData>(POOL_NAME, bullet);
      this.log(`释放对象，剩余活跃数=${this.activeBullets.length}`);
    }
  }

  /**
   * 显示对象池信息
   */
  private onShowInfo(): void {
    if (!this.poolManager) {
      return;
    }

    const info: PoolInfo | null = this.poolManager.getPoolInfo(POOL_NAME);
    if (info) {
      this.log(
        `池信息: name=${info.name}, size=${info.poolSize}, active=${info.activeCount}, created=${info.totalCreated}`
      );
    } else {
      this.log('对象池未注册');
    }
  }

  private log(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(`[ExamplePoolManager] ${message}`);
  }
}
