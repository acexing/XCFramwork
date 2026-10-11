import { _decorator, Component, Node, Label, Button, Slider, Toggle } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IAudioManager } from '../../core/interfaces/IAudioManager';
import { ILocalizationService, LanguageCode } from '../../core/interfaces/ILocalizationService';
import { ISaveService } from '../../core/interfaces/ISaveService';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { BaseView } from './BaseView';

const { ccclass, property } = _decorator;

@ccclass('SettingsPanel')
export class SettingsPanel extends BaseView {
  @property({ type: Slider, tooltip: '主音量滑块' })
  public masterVolumeSlider: Slider | null = null;

  @property({ type: Slider, tooltip: '音乐音量滑块' })
  public musicVolumeSlider: Slider | null = null;

  @property({ type: Slider, tooltip: '音效音量滑块' })
  public sfxVolumeSlider: Slider | null = null;

  @property({ type: Toggle, tooltip: '语言切换' })
  public languageToggle: Toggle | null = null;

  @property({ type: Label, tooltip: '语言标签' })
  public languageLabel: Label | null = null;

  @property({ type: Button, tooltip: '关闭按钮' })
  public closeButton: Button | null = null;

  private audioManager: IAudioManager | null = null;
  private localizationService: ILocalizationService | null = null;
  private saveService: ISaveService | null = null;

  onOpen(): void {
    try {
      this.audioManager = ServiceRegistry.get<IAudioManager>(SERVICE_TOKENS.AUDIO_MANAGER);
    } catch {
      this.audioManager = null;
    }

    try {
      this.localizationService = ServiceRegistry.get<ILocalizationService>(
        SERVICE_TOKENS.LOCALIZATION_SERVICE
      );
    } catch {
      this.localizationService = null;
    }

    try {
      this.saveService = ServiceRegistry.get<ISaveService>(SERVICE_TOKENS.SAVE_SERVICE);
    } catch {
      this.saveService = null;
    }

    this.setupSliders();
    this.setupLanguageToggle();
    this.setupCloseButton();
    this.loadSettings();
  }

  onClose(): void {
    this.saveSettings();
  }

  private setupSliders(): void {
    if (this.masterVolumeSlider) {
      this.masterVolumeSlider.node.on('slider-changed', this.onMasterVolumeChange, this);
    }
    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.node.on('slider-changed', this.onMusicVolumeChange, this);
    }
    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.node.on('slider-changed', this.onSfxVolumeChange, this);
    }
  }

  private setupLanguageToggle(): void {
    if (this.languageToggle) {
      this.languageToggle.node.on('toggle-changed', this.onLanguageToggle, this);
    }
  }

  private setupCloseButton(): void {
    if (this.closeButton) {
      this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClick, this);
    }
  }

  private loadSettings(): void {
    if (this.audioManager) {
      if (this.masterVolumeSlider) {
        this.masterVolumeSlider.progress = this.audioManager.getMasterVolume();
      }
      if (this.musicVolumeSlider) {
        this.musicVolumeSlider.progress = this.audioManager.getMusicVolume();
      }
      if (this.sfxVolumeSlider) {
        this.sfxVolumeSlider.progress = this.audioManager.getSfxVolume();
      }
    }

    if (this.localizationService) {
      const lang = this.localizationService.getLanguage();
      if (this.languageToggle) {
        this.languageToggle.isChecked = lang === 'en';
      }
      if (this.languageLabel) {
        this.languageLabel.string = lang === 'zh' ? '中文' : 'English';
      }
    }
  }

  private onMasterVolumeChange(slider: Slider): void {
    if (this.audioManager) {
      this.audioManager.setMasterVolume(slider.progress);
    }
  }

  private onMusicVolumeChange(slider: Slider): void {
    if (this.audioManager) {
      this.audioManager.setMusicVolume(slider.progress);
    }
  }

  private onSfxVolumeChange(slider: Slider): void {
    if (this.audioManager) {
      this.audioManager.setSfxVolume(slider.progress);
    }
  }

  private onLanguageToggle(toggle: Toggle): void {
    if (!this.localizationService) {
      return;
    }

    const newLang: LanguageCode = toggle.isChecked ? 'en' : 'zh';
    this.localizationService.setLanguage(newLang).catch(() => {});

    if (this.languageLabel) {
      this.languageLabel.string = newLang === 'zh' ? '中文' : 'English';
    }
  }

  private onCloseClick(): void {
    this.saveSettings();
    this.closeSelf();
  }

  private saveSettings(): void {
    if (this.saveService) {
      const settings = {
        masterVolume: this.audioManager?.getMasterVolume() ?? 1,
        musicVolume: this.audioManager?.getMusicVolume() ?? 1,
        sfxVolume: this.audioManager?.getSfxVolume() ?? 1,
        language: this.localizationService?.getLanguage() ?? 'zh',
      };
      this.saveService.save('settings', settings).catch(() => {});
    }
  }
}
