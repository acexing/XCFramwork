import { _decorator, Component, Label } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { ILocalizationService, LanguageCode } from '../../core/interfaces/ILocalizationService';
import { ServiceRegistry } from '../../app/ServiceRegistry';

const { ccclass, property } = _decorator;

@ccclass('L10nLabel')
export class L10nLabel extends Component {
  @property({ tooltip: '本地化文本 key，例如 common.ok' })
  public l10nKey: string = '';

  @property({ tooltip: '参数化文本的参数，JSON 格式' })
  public paramsJson: string = '';

  private label: Label | null = null;
  private localizationService: ILocalizationService | null = null;
  private languageChangedHandler: ((lang: LanguageCode) => void) | null = null;

  onLoad(): void {
    this.label = this.getComponent(Label);
    if (!this.label) {
      this.label = this.addComponent(Label);
    }

    try {
      this.localizationService = ServiceRegistry.get<ILocalizationService>(
        SERVICE_TOKENS.LOCALIZATION_SERVICE
      );
    } catch {
      this.localizationService = null;
    }

    if (this.localizationService) {
      this.languageChangedHandler = (_lang: LanguageCode) => {
        this.updateText();
      };
      this.localizationService.onLanguageChanged(this.languageChangedHandler);
    }

    this.updateText();
  }

  onDestroy(): void {
    if (this.localizationService && this.languageChangedHandler) {
      this.localizationService.offLanguageChanged(this.languageChangedHandler);
    }
  }

  public setKey(key: string, params?: Record<string, string | number>): void {
    this.l10nKey = key;
    if (params) {
      this.paramsJson = JSON.stringify(params);
    } else {
      this.paramsJson = '';
    }
    this.updateText();
  }

  private updateText(): void {
    if (!this.label || !this.localizationService || !this.l10nKey) {
      return;
    }

    let params: Record<string, string | number> | undefined;
    if (this.paramsJson) {
      try {
        params = JSON.parse(this.paramsJson) as Record<string, string | number>;
      } catch {
        params = undefined;
      }
    }

    this.label.string = this.localizationService.getText(this.l10nKey, params);
  }
}
