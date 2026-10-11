import { DEBUG } from 'cc/env';
import { sys } from 'cc';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import {
  ILocalizationService,
  LanguageCode,
  LanguageInfo,
  NumberFormatOptions,
  DateFormatOptions,
} from '../core/interfaces/ILocalizationService';
import { IAssetService } from '../core/interfaces/IAssetService';
import { IEventBus } from '../core/interfaces/IEventBus';
import { ILogger } from '../core/interfaces/ILogger';
import { ServiceRegistry } from '../app/ServiceRegistry';
import { GAME_EVENTS } from '../core/events/GameEvents';

const LOGGER_TAG = 'LocalizationService';
const SETTINGS_SLOT = 'settings';
const SETTINGS_LANGUAGE_KEY = 'language';
const DEFAULT_LANGUAGE: LanguageCode = 'zh';
const FALLBACK_LANGUAGE: LanguageCode = 'zh';

const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'zh', displayName: '中文', direction: 'ltr', fontId: 'default_font' },
  { code: 'en', displayName: 'English', direction: 'ltr', fontId: 'default_font', fallback: 'zh' },
];

interface NumberAbbreviation {
  threshold: number;
  suffix: string;
  divisor: number;
}

const NUMBER_ABBREVIATIONS: Record<LanguageCode, NumberAbbreviation[]> = {
  zh: [
    { threshold: 10000, suffix: '万', divisor: 10000 },
    { threshold: 100000000, suffix: '亿', divisor: 100000000 },
  ],
  en: [
    { threshold: 1000, suffix: 'K', divisor: 1000 },
    { threshold: 1000000, suffix: 'M', divisor: 1000000 },
    { threshold: 1000000000, suffix: 'B', divisor: 1000000000 },
  ],
};

const DATE_FORMATS: Record<LanguageCode, { datePattern: string; dateTimePattern: string }> = {
  zh: {
    datePattern: '{year}年{month}月{day}日',
    dateTimePattern: '{year}年{month}月{day}日 {hour}:{minute}',
  },
  en: {
    datePattern: '{monthShort} {day}, {year}',
    dateTimePattern: '{monthShort} {day}, {year} {hour}:{minute}',
  },
};

const MONTH_SHORT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export class LocalizationService implements ILocalizationService {
  private logger: ILogger;
  private assetService: IAssetService | null = null;
  private eventBus: IEventBus | null = null;
  private currentLanguage: LanguageCode = DEFAULT_LANGUAGE;
  private textTables = new Map<LanguageCode, Map<string, string>>();
  private languageChangedHandlers: ((lang: LanguageCode) => void)[] = [];
  private missingKeyWarnings = new Set<string>();
  private initialized = false;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async init(): Promise<void> {
    this.assetService = ServiceRegistry.get<IAssetService>(SERVICE_TOKENS.ASSET_SERVICE);
    this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);

    this.currentLanguage = this.detectInitialLanguage();
    await this.loadLanguageTable(this.currentLanguage);

    if (this.currentLanguage !== FALLBACK_LANGUAGE) {
      await this.loadLanguageTable(FALLBACK_LANGUAGE);
    }

    this.initialized = true;
    this.logger.info(
      LOGGER_TAG,
      `LocalizationService 初始化完成，当前语言: ${this.currentLanguage}`
    );
  }

  getText(key: string, params?: Record<string, string | number>): string {
    if (!this.initialized) {
      return key;
    }

    const currentTable = this.textTables.get(this.currentLanguage);
    let text: string | undefined;

    if (currentTable) {
      text = currentTable.get(key);
    }

    if (text === undefined) {
      const fallbackTable = this.textTables.get(FALLBACK_LANGUAGE);
      if (fallbackTable) {
        text = fallbackTable.get(key);
      }
    }

    if (text === undefined) {
      this.onMissingKey(key);
      return DEBUG ? `[MISSING: ${key}]` : key;
    }

    if (params) {
      text = this.formatText(text, params);
    }

    return text;
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  async setLanguage(lang: LanguageCode): Promise<void> {
    if (lang === this.currentLanguage) {
      return;
    }

    if (!this.textTables.has(lang)) {
      await this.loadLanguageTable(lang);
    }

    this.currentLanguage = lang;
    this.saveLanguagePreference(lang);
    this.notifyLanguageChanged();

    this.logger.info(LOGGER_TAG, `语言切换: ${lang}`);
  }

  getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  }

  hasKey(key: string): boolean {
    const currentTable = this.textTables.get(this.currentLanguage);
    if (currentTable && currentTable.has(key)) {
      return true;
    }
    const fallbackTable = this.textTables.get(FALLBACK_LANGUAGE);
    if (fallbackTable && fallbackTable.has(key)) {
      return true;
    }
    return false;
  }

  onLanguageChanged(handler: (lang: LanguageCode) => void): void {
    this.languageChangedHandlers.push(handler);
  }

  offLanguageChanged(handler: (lang: LanguageCode) => void): void {
    const index = this.languageChangedHandlers.indexOf(handler);
    if (index >= 0) {
      this.languageChangedHandlers.splice(index, 1);
    }
  }

  formatNumber(value: number, options?: NumberFormatOptions): string {
    if (options?.abbreviate) {
      const abbreviations = NUMBER_ABBREVIATIONS[this.currentLanguage];
      for (const abbr of abbreviations) {
        if (value >= abbr.threshold) {
          const abbreviated = value / abbr.divisor;
          const formatted = abbreviated.toFixed(1);
          return formatted + abbr.suffix;
        }
      }
    }

    if (options?.useGrouping !== false) {
      return value.toLocaleString();
    }

    return String(value);
  }

  formatDate(timestamp: number, options?: DateFormatOptions): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();

    const formatConfig = DATE_FORMATS[this.currentLanguage];

    let pattern: string;
    if (options?.showTime) {
      pattern = formatConfig.dateTimePattern;
    } else {
      pattern = formatConfig.datePattern;
    }

    let result = pattern
      .replace('{year}', String(year))
      .replace('{month}', String(month))
      .replace('{day}', String(day))
      .replace('{hour}', hour < 10 ? '0' + hour : String(hour))
      .replace('{minute}', minute < 10 ? '0' + minute : String(minute));

    if (this.currentLanguage === 'en') {
      result = result.replace('{monthShort}', MONTH_SHORT_EN[date.getMonth()]);
    }

    return result;
  }

  getLocalizedAssetPath(basePath: string, extension: string): string {
    return `${basePath}_${this.currentLanguage}.${extension}`;
  }

  getFontId(): string {
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === this.currentLanguage);
    return langInfo?.fontId ?? 'default_font';
  }

  private async loadLanguageTable(lang: LanguageCode): Promise<void> {
    if (this.textTables.has(lang)) {
      return;
    }
    if (!this.assetService) {
      this.logger.error(LOGGER_TAG, 'AssetService 未初始化');
      return;
    }

    try {
      const path = `config/localization_${lang}`;
      const jsonAsset = await this.assetService.loadJson('resources', path);
      const data = jsonAsset.json as Record<string, unknown>;
      const flatTable = this.flattenJson(data);
      this.textTables.set(lang, flatTable);
      this.logger.debug(LOGGER_TAG, `加载语言文本表: ${lang} (${flatTable.size} keys)`);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `语言文本表加载失败: ${lang}`, error);
      if (lang === FALLBACK_LANGUAGE) {
        this.textTables.set(lang, new Map());
      }
    }
  }

  private flattenJson(data: Record<string, unknown>, prefix: string = ''): Map<string, string> {
    const result = new Map<string, string>();

    for (const key of Object.keys(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = data[key];

      if (typeof value === 'string') {
        result.set(fullKey, value);
      } else if (typeof value === 'object' && value !== null) {
        const nested = this.flattenJson(value as Record<string, unknown>, fullKey);
        for (const [k, v] of Array.from(nested.entries())) {
          result.set(k, v);
        }
      }
    }

    return result;
  }

  private formatText(template: string, params: Record<string, string | number>): string {
    let result = template;

    const pluralMatch = result.match(
      /\{(\w+),\s*plural,\s*=0\s*\{([^}]*)\}\s*=1\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/
    );
    if (pluralMatch) {
      const paramName = pluralMatch[1];
      const count = params[paramName];
      if (typeof count === 'number') {
        let replacement: string;
        if (count === 0) {
          replacement = pluralMatch[2];
        } else if (count === 1) {
          replacement = pluralMatch[3];
        } else {
          replacement = pluralMatch[4].replace(/#/g, String(count));
        }
        result = result.replace(pluralMatch[0], replacement);
      }
    }

    for (const paramName of Object.keys(params)) {
      const placeholder = `{${paramName}}`;
      const value = String(params[paramName]);
      result = result.replace(placeholder, value);
    }

    return result;
  }

  private onMissingKey(key: string): void {
    if (this.missingKeyWarnings.has(key)) {
      return;
    }
    this.missingKeyWarnings.add(key);
    this.logger.warn(LOGGER_TAG, `缺失本地化 key: ${key}`);
  }

  private notifyLanguageChanged(): void {
    for (const handler of this.languageChangedHandlers) {
      handler(this.currentLanguage);
    }
    if (this.eventBus) {
      this.eventBus.emit(GAME_EVENTS.UI_LANGUAGE_CHANGED, { language: this.currentLanguage });
    }
  }

  private detectInitialLanguage(): LanguageCode {
    try {
      const raw = sys.localStorage.getItem(SETTINGS_LANGUAGE_KEY);
      if (raw === 'zh' || raw === 'en') {
        return raw;
      }
    } catch {
      // localStorage 不可用
    }

    const systemLang = sys.language;
    if (systemLang === sys.Language.CHINESE) {
      return 'zh';
    }

    return DEFAULT_LANGUAGE;
  }

  private saveLanguagePreference(lang: LanguageCode): void {
    try {
      sys.localStorage.setItem(SETTINGS_LANGUAGE_KEY, lang);
    } catch (error) {
      this.logger.warn(LOGGER_TAG, '语言偏好保存失败', error);
    }
  }
}
