import { _decorator, Component, Label, Button, Toggle } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import {
  ILocalizationService,
  LanguageCode,
} from '../scripts/core/interfaces/ILocalizationService';
import { L10N_KEYS } from '../scripts/core/interfaces/LocalizationKeys';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

/**
 * 示例5: LocalizationService 本地化使用演示
 *
 * 本示例展示如何使用框架的 LocalizationService 进行文本本地化：
 * - getText(): 获取本地化文本
 * - setLanguage(): 切换语言
 * - getLanguage(): 获取当前语言
 * - onLanguageChanged(): 监听语言切换
 * - formatNumber(): 格式化数字（支持缩写）
 * - formatDate(): 格式化日期
 * - getLocalizedAssetPath(): 获取本地化资源路径
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 UI 组件
 * 3. 运行场景，切换语言查看文本变化
 */
@ccclass('ExampleLocalization')
export class ExampleLocalization extends Component {
  @property({ type: Label, tooltip: '本地化文本显示' })
  public textLabel: Label | null = null;

  @property({ type: Label, tooltip: '数字格式化显示' })
  public numberLabel: Label | null = null;

  @property({ type: Label, tooltip: '日期格式化显示' })
  public dateLabel: Label | null = null;

  @property({ type: Toggle, tooltip: '语言切换开关' })
  public languageToggle: Toggle | null = null;

  @property({ type: Button, tooltip: '刷新文本按钮' })
  public refreshButton: Button | null = null;

  private localizationService: ILocalizationService | null = null;

  onLoad(): void {
    try {
      this.localizationService = ServiceRegistry.get<ILocalizationService>(
        SERVICE_TOKENS.LOCALIZATION_SERVICE
      );
    } catch {
      this.localizationService = null;
      this.log('LocalizationService 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.setupControls();
    this.subscribeLanguageChanged();
    this.refreshAllText();
  }

  onDestroy(): void {
    if (this.localizationService) {
      this.localizationService.offLanguageChanged(this.onLanguageChanged);
    }
    if (this.languageToggle) {
      this.languageToggle.node.off('toggle-changed', this.onLanguageToggle, this);
    }
    if (this.refreshButton) {
      this.refreshButton.node.off(Button.EventType.CLICK, this.onRefresh, this);
    }
  }

  private setupControls(): void {
    if (this.languageToggle) {
      const currentLang = this.localizationService?.getLanguage() ?? 'zh';
      this.languageToggle.isChecked = currentLang === 'en';
      this.languageToggle.node.on('toggle-changed', this.onLanguageToggle, this);
    }

    if (this.refreshButton) {
      this.refreshButton.node.on(Button.EventType.CLICK, this.onRefresh, this);
    }
  }

  private subscribeLanguageChanged(): void {
    if (this.localizationService) {
      this.localizationService.onLanguageChanged(this.onLanguageChanged);
    }
  }

  /**
   * 语言切换回调 —— 自动刷新所有本地化文本
   */
  private onLanguageChanged = (_lang: LanguageCode): void => {
    this.refreshAllText();
  };

  private onLanguageToggle(toggle: Toggle): void {
    if (!this.localizationService) {
      return;
    }

    const newLang: LanguageCode = toggle.isChecked ? 'en' : 'zh';
    this.localizationService.setLanguage(newLang).catch(() => {});
  }

  private onRefresh(): void {
    this.refreshAllText();
  }

  /**
   * 刷新所有本地化文本显示
   */
  private refreshAllText(): void {
    if (!this.localizationService) {
      return;
    }

    // 使用 L10N_KEYS 常量获取本地化文本
    if (this.textLabel) {
      const okText = this.localizationService.getText(L10N_KEYS.CommonOk);
      const startText = this.localizationService.getText(L10N_KEYS.MenuStartGame);
      const settingsText = this.localizationService.getText(L10N_KEYS.MenuSettings);
      this.textLabel.string = `${okText} | ${startText} | ${settingsText}`;
    }

    // 数字格式化演示（支持缩写：万/亿 或 K/M/B）
    if (this.numberLabel) {
      const num1 = this.localizationService.formatNumber(12345, { abbreviate: true });
      const num2 = this.localizationService.formatNumber(100000000, { abbreviate: true });
      this.numberLabel.string = `${num1} / ${num2}`;
    }

    // 日期格式化演示
    if (this.dateLabel) {
      const now = Date.now();
      const dateStr = this.localizationService.formatDate(now, { showTime: true });
      this.dateLabel.string = dateStr;
    }

    // 获取本地化资源路径（用于加载不同语言的图片/音频）
    const assetPath = this.localizationService.getLocalizedAssetPath('textures/title', 'png');
    console.log(`[ExampleLocalization] 本地化资源路径: ${assetPath}`);

    // 获取当前语言对应的字体 ID
    const fontId = this.localizationService.getFontId();
    console.log(`[ExampleLocalization] 字体 ID: ${fontId}`);
  }

  private log(message: string): void {
    console.log(`[ExampleLocalization] ${message}`);
  }
}
