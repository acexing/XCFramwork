export type LanguageCode = 'zh' | 'en';

export interface LanguageInfo {
  code: LanguageCode;
  displayName: string;
  direction: 'ltr' | 'rtl';
  fontId: string;
  fallback?: LanguageCode;
}

export interface NumberFormatOptions {
  useGrouping?: boolean;
  abbreviate?: boolean;
}

export interface DateFormatOptions {
  showTime?: boolean;
  showYear?: boolean;
}

export interface ILocalizationService {
  init(): Promise<void>;
  getText(key: string, params?: Record<string, string | number>): string;
  getLanguage(): LanguageCode;
  setLanguage(lang: LanguageCode): Promise<void>;
  getSupportedLanguages(): LanguageInfo[];
  hasKey(key: string): boolean;
  onLanguageChanged(handler: (lang: LanguageCode) => void): void;
  offLanguageChanged(handler: (lang: LanguageCode) => void): void;
  formatNumber(value: number, options?: NumberFormatOptions): string;
  formatDate(timestamp: number, options?: DateFormatOptions): string;
  getLocalizedAssetPath(basePath: string, extension: string): string;
  getFontId(): string;
}
