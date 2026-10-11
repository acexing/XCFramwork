import { _decorator, Component, input, Input, EventKeyboard, KeyCode } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';

const { ccclass } = _decorator;

const KEYBOARD_VIEW_IDS: string[] = [
  'MainMenu',
  'LoginDialog',
  'StageView',
  'StageStartDialog',
  'StageCompleteDialog',
  'LevelUpDialog',
  'MissionDialog',
  'ShopCoinDialog',
  'ShopGemDialog',
  'ShopLifeDialog',
  'ItemShopView',
  'MessageDialog',
  'SettingsDialog',
  'PauseDialog',
  'RankingDialog',
];

@ccclass('DemoUIController')
export class DemoUIController extends Component {
  private uiManager: IUIManager | null = null;

  start(): void {
    try {
      this.uiManager = ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
    } catch {
      console.warn('[DemoUIController] UIManager 未注册，请确保 GameBootstrap 已初始化');
      return;
    }
    void this.uiManager.open('MainMenu');
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private onKeyDown(event: EventKeyboard): void {
    if (!this.uiManager) {
      return;
    }
    if (event.keyCode === KeyCode.ESCAPE) {
      this.uiManager.closeAll();
      return;
    }
    if (event.keyCode === KeyCode.BACKSPACE) {
      this.uiManager.open('MainMenu');
      return;
    }
    const index = this.viewIndexByKey(event.keyCode);
    if (index >= 0 && index < KEYBOARD_VIEW_IDS.length) {
      const viewId = KEYBOARD_VIEW_IDS[index];
      if (this.uiManager.isOpen(viewId)) {
        this.uiManager.close(viewId);
      } else {
        void this.uiManager.open(viewId);
      }
    }
  }

  private viewIndexByKey(keyCode: number): number {
    const digitKeys = [
      KeyCode.DIGIT_1,
      KeyCode.DIGIT_2,
      KeyCode.DIGIT_3,
      KeyCode.DIGIT_4,
      KeyCode.DIGIT_5,
      KeyCode.DIGIT_6,
      KeyCode.DIGIT_7,
      KeyCode.DIGIT_8,
      KeyCode.DIGIT_9,
      KeyCode.DIGIT_0,
    ];
    return digitKeys.indexOf(keyCode);
  }
}