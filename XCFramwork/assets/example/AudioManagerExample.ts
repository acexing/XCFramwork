import { _decorator, Component, Label, Button, Slider } from 'cc';
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { IAudioManager } from '../scripts/core/interfaces/IAudioManager';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';

const { ccclass, property } = _decorator;

/**
 * 示例4: AudioManager 音频管理使用演示
 *
 * 本示例展示如何使用框架的 AudioManager 播放音频和控制音量：
 * - playMusic(): 播放背景音乐（支持淡入淡出）
 * - stopMusic(): 停止背景音乐
 * - playSfx(): 播放音效
 * - setMasterVolume() / setMusicVolume() / setSfxVolume(): 设置音量
 * - setMusicMuted() / setSfxMuted(): 静音控制
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点
 * 2. 绑定 UI 组件
 * 3. 运行场景，操作滑块和按钮演示音频控制
 *
 * 注意：需要将音频资源放入对应 Bundle 目录才能播放
 */
@ccclass('ExampleAudioManager')
export class ExampleAudioManager extends Component {
  @property({ type: Label, tooltip: '状态显示标签' })
  public statusLabel: Label | null = null;

  @property({ type: Button, tooltip: '播放音乐按钮' })
  public playMusicButton: Button | null = null;

  @property({ type: Button, tooltip: '停止音乐按钮' })
  public stopMusicButton: Button | null = null;

  @property({ type: Button, tooltip: '播放音效按钮' })
  public playSfxButton: Button | null = null;

  @property({ type: Slider, tooltip: '主音量滑块' })
  public masterVolumeSlider: Slider | null = null;

  @property({ type: Slider, tooltip: '音乐音量滑块' })
  public musicVolumeSlider: Slider | null = null;

  @property({ type: Slider, tooltip: '音效音量滑块' })
  public sfxVolumeSlider: Slider | null = null;

  private audioManager: IAudioManager | null = null;

  onLoad(): void {
    try {
      this.audioManager = ServiceRegistry.get<IAudioManager>(SERVICE_TOKENS.AUDIO_MANAGER);
    } catch {
      this.audioManager = null;
      this.log('AudioManager 未注册，请确保 GameBootstrap 已初始化');
      return;
    }

    this.setupButtons();
    this.setupSliders();
    this.loadCurrentSettings();
    this.log('AudioManager 就绪');
  }

  onDestroy(): void {
    this.offButtonClick(this.playMusicButton, this.onPlayMusic);
    this.offButtonClick(this.stopMusicButton, this.onStopMusic);
    this.offButtonClick(this.playSfxButton, this.onPlaySfx);

    if (this.masterVolumeSlider) {
      this.masterVolumeSlider.node.off('slider-changed', this.onMasterVolumeChange, this);
    }
    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.node.off('slider-changed', this.onMusicVolumeChange, this);
    }
    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.node.off('slider-changed', this.onSfxVolumeChange, this);
    }
  }

  private setupButtons(): void {
    this.onButtonClick(this.playMusicButton, this.onPlayMusic);
    this.onButtonClick(this.stopMusicButton, this.onStopMusic);
    this.onButtonClick(this.playSfxButton, this.onPlaySfx);
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

  private loadCurrentSettings(): void {
    if (!this.audioManager) {
      return;
    }

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

  private async onPlayMusic(): Promise<void> {
    if (!this.audioManager) {
      return;
    }

    try {
      // 播放背景音乐，带淡入效果
      await this.audioManager.playMusic('resources', 'audio/bgm_main', {
        loop: true,
        fadeIn: 1.0,
      });
      this.log('播放背景音乐');
    } catch (error) {
      this.log(`播放音乐失败（需放入音频资源）: ${error}`);
    }
  }

  private onStopMusic(): void {
    if (!this.audioManager) {
      return;
    }

    this.audioManager.stopMusic(0.5);
    this.log('停止背景音乐');
  }

  private async onPlaySfx(): Promise<void> {
    if (!this.audioManager) {
      return;
    }

    try {
      await this.audioManager.playSfx('resources', 'audio/sfx_click');
      this.log('播放音效');
    } catch (error) {
      this.log(`播放音效失败（需放入音频资源）: ${error}`);
    }
  }

  private onMasterVolumeChange(slider: Slider): void {
    if (this.audioManager) {
      this.audioManager.setMasterVolume(slider.progress);
      this.log(`主音量: ${Math.round(slider.progress * 100)}%`);
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

  private log(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(`[ExampleAudioManager] ${message}`);
  }
}
