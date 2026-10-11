import { AudioSource, AudioClip, director, game, Game, Node, sys } from 'cc';

import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import {
  IAudioManager,
  MusicOptions,
  SfxOptions,
  AudioSettings,
} from '../core/interfaces/IAudioManager';
import { IAssetService } from '../core/interfaces/IAssetService';
import { ILogger } from '../core/interfaces/ILogger';
import { ServiceRegistry } from '../app/ServiceRegistry';

const LOGGER_TAG = 'AudioManager';

const DEFAULT_SFX_POOL_SIZE = 8;
const SFX_DEBOUNCE_MS = 100;
const SETTINGS_KEY = 'audio_settings';
const FADE_STEP_MS = 50;

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 1,
  musicVolume: 0.8,
  sfxVolume: 1,
  musicMuted: false,
  sfxMuted: false,
};

export class AudioManager implements IAudioManager {
  private logger: ILogger;
  private assetService: IAssetService | null = null;
  private musicSource: AudioSource | null = null;
  private sfxSources: AudioSource[] = [];
  private sfxPoolSize = DEFAULT_SFX_POOL_SIZE;
  private currentMusic: string | null = null;
  private currentMusicBundle: string | null = null;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private lastSfxTime = new Map<string, number>();
  private musicNode: Node | null = null;
  private sfxNode: Node | null = null;
  private initialized = false;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async init(): Promise<void> {
    this.assetService = ServiceRegistry.get<IAssetService>(SERVICE_TOKENS.ASSET_SERVICE);
    this.loadSettings();
    this.ensureAudioSources();
    this.registerLifecycleHandlers();
    this.initialized = true;
    this.logger.info(LOGGER_TAG, `AudioManager 初始化完成，Sfx池: ${this.sfxPoolSize}`);
  }

  async playMusic(bundleName: string, path: string, options?: MusicOptions): Promise<void> {
    if (!this.initialized || !this.assetService || !this.musicSource) {
      this.logger.warn(LOGGER_TAG, 'AudioManager 未初始化，忽略 playMusic');
      return;
    }

    const musicKey = `${bundleName}:${path}`;
    if (this.currentMusic === musicKey && this.musicSource.playing) {
      this.logger.debug(LOGGER_TAG, `音乐正在播放，忽略重复请求: ${musicKey}`);
      return;
    }

    const loop = options?.loop ?? true;
    const fadeIn = options?.fadeIn ?? 0;
    const fadeOutPrevious = options?.fadeOutPrevious ?? 0;

    try {
      const clip = await this.assetService.loadAudioClip(bundleName, path);

      if (fadeOutPrevious > 0 && this.musicSource.playing) {
        await this.fadeVolume(this.musicSource, this.getEffectiveMusicVolume(), 0, fadeOutPrevious);
        this.musicSource.stop();
      } else {
        this.musicSource.stop();
      }

      this.musicSource.clip = clip;
      this.musicSource.loop = loop;

      if (this.settings.musicMuted) {
        this.musicSource.volume = 0;
      } else if (fadeIn > 0) {
        this.musicSource.volume = 0;
        this.musicSource.play();
        await this.fadeVolume(this.musicSource, 0, this.getEffectiveMusicVolume(), fadeIn);
      } else {
        this.musicSource.volume = this.getEffectiveMusicVolume();
        this.musicSource.play();
      }

      this.currentMusic = musicKey;
      this.currentMusicBundle = bundleName;
      this.logger.info(LOGGER_TAG, `播放音乐: ${musicKey}`);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `音乐加载失败: ${musicKey}`, error);
      throw error;
    }
  }

  stopMusic(fadeDuration: number = 0): void {
    if (!this.musicSource) {
      return;
    }

    if (fadeDuration > 0 && this.musicSource.playing) {
      const fromVol = this.musicSource.volume;
      this.fadeVolume(this.musicSource, fromVol, 0, fadeDuration).then(() => {
        if (this.musicSource) {
          this.musicSource.stop();
        }
      });
    } else {
      this.musicSource.stop();
    }

    this.currentMusic = null;
    this.currentMusicBundle = null;
    this.logger.debug(LOGGER_TAG, '停止音乐');
  }

  pauseMusic(): void {
    if (this.musicSource && this.musicSource.playing) {
      this.musicSource.pause();
      this.logger.debug(LOGGER_TAG, '暂停音乐');
    }
  }

  resumeMusic(): void {
    if (this.musicSource && this.musicSource.state === AudioSource.AudioState.PAUSED) {
      this.musicSource.play();
      this.logger.debug(LOGGER_TAG, '恢复音乐');
    }
  }

  async playSfx(bundleName: string, path: string, options?: SfxOptions): Promise<void> {
    if (!this.initialized || !this.assetService) {
      this.logger.warn(LOGGER_TAG, 'AudioManager 未初始化，忽略 playSfx');
      return;
    }

    if (this.settings.sfxMuted) {
      this.logger.debug(LOGGER_TAG, '音效已静音，忽略播放');
      return;
    }

    const sfxKey = `${bundleName}:${path}`;
    const now = Date.now();
    const lastTime = this.lastSfxTime.get(sfxKey) ?? 0;
    if (now - lastTime < SFX_DEBOUNCE_MS) {
      this.logger.debug(LOGGER_TAG, `音效防重复，忽略: ${sfxKey}`);
      return;
    }
    this.lastSfxTime.set(sfxKey, now);

    const source = this.getAvailableSfxSource();
    if (!source) {
      this.logger.warn(LOGGER_TAG, '无可用音效源，忽略播放');
      return;
    }

    try {
      const clip = await this.assetService.loadAudioClip(bundleName, path);
      source.clip = clip;
      source.loop = options?.loop ?? false;
      const volumeScale = options?.volumeScale ?? 1;
      source.volume = this.getEffectiveSfxVolume() * volumeScale;
      source.play();
      this.logger.debug(LOGGER_TAG, `播放音效: ${sfxKey}`);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `音效加载失败: ${sfxKey}`, error);
    }
  }

  stopAllSfx(): void {
    for (const source of this.sfxSources) {
      source.stop();
    }
    this.logger.debug(LOGGER_TAG, '停止所有音效');
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = this.clampVolume(volume);
    this.applyVolumes();
    this.saveSettingsDebounced();
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = this.clampVolume(volume);
    this.applyVolumes();
    this.saveSettingsDebounced();
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = this.clampVolume(volume);
    this.saveSettingsDebounced();
  }

  getMasterVolume(): number {
    return this.settings.masterVolume;
  }

  getMusicVolume(): number {
    return this.settings.musicVolume;
  }

  getSfxVolume(): number {
    return this.settings.sfxVolume;
  }

  setMusicMuted(muted: boolean): void {
    this.settings.musicMuted = muted;
    this.applyVolumes();
    this.saveSettingsDebounced();
  }

  setSfxMuted(muted: boolean): void {
    this.settings.sfxMuted = muted;
    this.saveSettingsDebounced();
  }

  isMusicMuted(): boolean {
    return this.settings.musicMuted;
  }

  isSfxMuted(): boolean {
    return this.settings.sfxMuted;
  }

  isMusicPlaying(): boolean {
    return this.musicSource !== null && this.musicSource.playing;
  }

  getCurrentMusic(): string | null {
    return this.currentMusic;
  }

  private ensureAudioSources(): void {
    const scene = director.getScene();
    if (!scene) {
      this.logger.error(LOGGER_TAG, '无活动场景，无法创建 AudioSource');
      return;
    }

    const canvas = scene.getChildByName('Canvas') ?? scene;

    this.musicNode = canvas.getChildByName('MusicSource');
    if (!this.musicNode) {
      this.musicNode = new Node('MusicSource');
      canvas.addChild(this.musicNode);
      this.musicSource = this.musicNode.addComponent(AudioSource);
      this.logger.debug(LOGGER_TAG, '创建音乐 AudioSource');
    } else {
      this.musicSource = this.musicNode.getComponent(AudioSource);
      if (!this.musicSource) {
        this.musicSource = this.musicNode.addComponent(AudioSource);
      }
    }

    this.sfxNode = canvas.getChildByName('SfxSources');
    if (!this.sfxNode) {
      this.sfxNode = new Node('SfxSources');
      canvas.addChild(this.sfxNode);
      this.logger.debug(LOGGER_TAG, '创建音效 AudioSource 池');
    }

    for (let i = 0; i < this.sfxPoolSize; i++) {
      const childName = `SfxSource_${i}`;
      let child = this.sfxNode.getChildByName(childName);
      if (!child) {
        child = new Node(childName);
        this.sfxNode.addChild(child);
      }
      let source = child.getComponent(AudioSource);
      if (!source) {
        source = child.addComponent(AudioSource);
      }
      this.sfxSources.push(source);
    }
  }

  private getAvailableSfxSource(): AudioSource | null {
    for (const source of this.sfxSources) {
      if (!source.playing) {
        return source;
      }
    }
    if (this.sfxSources.length > 0) {
      const oldest = this.sfxSources[0];
      oldest.stop();
      return oldest;
    }
    return null;
  }

  private getEffectiveMusicVolume(): number {
    if (this.settings.musicMuted) {
      return 0;
    }
    return this.settings.masterVolume * this.settings.musicVolume;
  }

  private getEffectiveSfxVolume(): number {
    if (this.settings.sfxMuted) {
      return 0;
    }
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  private applyVolumes(): void {
    if (this.musicSource) {
      this.musicSource.volume = this.getEffectiveMusicVolume();
    }
  }

  private fadeVolume(
    source: AudioSource,
    from: number,
    to: number,
    duration: number
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const steps = Math.max(1, Math.floor(duration / FADE_STEP_MS));
      const stepDuration = duration / steps;
      const delta = (to - from) / steps;
      let currentStep = 0;

      source.volume = from;

      const doStep = () => {
        currentStep++;
        if (currentStep >= steps) {
          source.volume = to;
          resolve();
          return;
        }
        source.volume = from + delta * currentStep;
        setTimeout(doStep, stepDuration);
      };

      setTimeout(doStep, stepDuration);
    });
  }

  private clampVolume(volume: number): number {
    if (volume < 0) {
      return 0;
    }
    if (volume > 1) {
      return 1;
    }
    return volume;
  }

  private loadSettings(): void {
    try {
      const raw = sys.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>;
        this.settings = {
          masterVolume: parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume,
          musicVolume: parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
          sfxVolume: parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume,
          musicMuted: parsed.musicMuted ?? DEFAULT_SETTINGS.musicMuted,
          sfxMuted: parsed.sfxMuted ?? DEFAULT_SETTINGS.sfxMuted,
        };
        this.logger.debug(LOGGER_TAG, '音频设置已加载');
      }
    } catch (error) {
      this.logger.warn(LOGGER_TAG, '音频设置加载失败，使用默认值', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettingsDebounced(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveSettings();
    }, 500);
  }

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private saveSettings(): void {
    try {
      sys.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.logger.debug(LOGGER_TAG, '音频设置已保存');
    } catch (error) {
      this.logger.warn(LOGGER_TAG, '音频设置保存失败', error);
    }
  }

  private registerLifecycleHandlers(): void {
    game.on(Game.EVENT_HIDE, this.onAppHide, this);
    game.on(Game.EVENT_SHOW, this.onAppShow, this);
  }

  private onAppHide(): void {
    this.pauseMusic();
    this.logger.debug(LOGGER_TAG, '应用切后台，暂停音乐');
  }

  private onAppShow(): void {
    this.resumeMusic();
    this.logger.debug(LOGGER_TAG, '应用回前台，恢复音乐');
  }
}
