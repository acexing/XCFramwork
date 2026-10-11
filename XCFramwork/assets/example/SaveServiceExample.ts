import { _decorator, Component, Label, Button } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { ISaveService, MigrationFn } from '../scripts/core/interfaces/ISaveService';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

interface PlayerProgress {
  level: number;
  coins: number;
  items: string[];
}

/**
 * 示例3: SaveService 存档管理使用演示
 *
 * 本示例展示如何使用框架的 SaveService 进行存档管理：
 * - save(): 保存数据到指定存档槽
 * - load(): 从存档槽读取数据
 * - hasSave(): 检查存档是否存在
 * - deleteSave(): 删除存档
 * - registerMigration(): 注册版本迁移函数
 * - exportSave() / importSave(): 导出/导入存档
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 resultLabel 和按钮
 * 3. 运行场景，点击按钮演示存档操作
 */
@ccclass('ExampleSaveService')
export class ExampleSaveService extends Component {
  @property({ type: Label, tooltip: '结果显示标签' })
  public resultLabel: Label | null = null;

  @property({ type: Button, tooltip: '保存存档按钮' })
  public saveButton: Button | null = null;

  @property({ type: Button, tooltip: '读取存档按钮' })
  public loadButton: Button | null = null;

  @property({ type: Button, tooltip: '删除存档按钮' })
  public deleteButton: Button | null = null;

  private saveService: ISaveService | null = null;
  private readonly SAVE_SLOT = 'player_progress';

  onLoad(): void {
    try {
      this.saveService = ServiceRegistry.get<ISaveService>(SERVICE_TOKENS.SAVE_SERVICE);
    } catch {
      this.saveService = null;
      this.log('SaveService 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.registerMigration();
    this.setupButtons();

    // 检查是否已有存档
    if (this.saveService.hasSave(this.SAVE_SLOT)) {
      this.log('发现已有存档');
    } else {
      this.log('无存档，点击保存按钮创建');
    }
  }

  onDestroy(): void {
    this.offButtonClick(this.saveButton, this.onSave);
    this.offButtonClick(this.loadButton, this.onLoadSave);
    this.offButtonClick(this.deleteButton, this.onDelete);
  }

  /**
   * 注册版本迁移函数
   * 当存档的 schemaVersion 低于当前版本时，会依次执行迁移函数
   */
  private registerMigration(): void {
    if (!this.saveService) {
      return;
    }

    // 从版本 0 迁移到版本 1：添加 items 字段
    const migrateV0ToV1: MigrationFn = (oldData: unknown) => {
      const old = oldData as Partial<PlayerProgress>;
      return {
        level: old.level ?? 1,
        coins: old.coins ?? 0,
        items: [],
      };
    };

    this.saveService.registerMigration(0, migrateV0ToV1);
  }

  private setupButtons(): void {
    this.onButtonClick(this.saveButton, this.onSave);
    this.onButtonClick(this.loadButton, this.onLoadSave);
    this.onButtonClick(this.deleteButton, this.onDelete);
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

  private async onSave(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    const progress: PlayerProgress = {
      level: 5,
      coins: 1200,
      items: ['sword', 'shield', 'potion'],
    };

    try {
      await this.saveService.save(this.SAVE_SLOT, progress);
      this.log(`存档保存成功: Lv.${progress.level}, ${progress.coins}金币`);
    } catch (error) {
      this.log(`存档保存失败: ${error}`);
    }
  }

  private async onLoadSave(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    try {
      const data = await this.saveService.load<PlayerProgress>(this.SAVE_SLOT);
      if (data) {
        this.log(`读取存档: Lv.${data.level}, ${data.coins}金币, ${data.items.length}物品`);
      } else {
        this.log('无存档数据');
      }
    } catch (error) {
      this.log(`读取存档失败: ${error}`);
    }
  }

  private async onDelete(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    try {
      await this.saveService.deleteSave(this.SAVE_SLOT);
      this.log('存档已删除');
    } catch (error) {
      this.log(`删除存档失败: ${error}`);
    }
  }

  private log(message: string): void {
    if (this.resultLabel) {
      this.resultLabel.string = message;
    }
    console.log(`[ExampleSaveService] ${message}`);
  }
}
