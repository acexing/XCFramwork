export interface MusicOptions {
  loop?: boolean;
  fadeIn?: number;
  fadeOutPrevious?: number;
}

export interface SfxOptions {
  volumeScale?: number;
  loop?: boolean;
}

export interface AudioVolumes {
  master: number;
  music: number;
  sfx: number;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export interface IAudioManager {
  init(): Promise<void>;
  playMusic(bundleName: string, path: string, options?: MusicOptions): Promise<void>;
  stopMusic(fadeDuration?: number): void;
  pauseMusic(): void;
  resumeMusic(): void;

  playSfx(bundleName: string, path: string, options?: SfxOptions): Promise<void>;
  stopAllSfx(): void;

  setMasterVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  setSfxVolume(volume: number): void;
  getMasterVolume(): number;
  getMusicVolume(): number;
  getSfxVolume(): number;

  setMusicMuted(muted: boolean): void;
  setSfxMuted(muted: boolean): void;
  isMusicMuted(): boolean;
  isSfxMuted(): boolean;

  isMusicPlaying(): boolean;
  getCurrentMusic(): string | null;
}
