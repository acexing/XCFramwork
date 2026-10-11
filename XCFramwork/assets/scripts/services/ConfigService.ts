import { DEBUG } from 'cc/env';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';
import {
  IConfigService,
  ConfigSchema,
  ValidationResult,
  ConfigError,
  SchemaField,
} from '../core/interfaces/IConfigService';
import { IAssetService } from '../core/interfaces/IAssetService';
import { ILogger } from '../core/interfaces/ILogger';
import { ServiceRegistry } from '../app/ServiceRegistry';

const LOGGER_TAG = 'ConfigService';

interface ConfigRecord {
  name: string;
  data: unknown;
  index: Map<string, unknown>;
  loadedAt: number;
}

export class ConfigService implements IConfigService {
  private logger: ILogger;
  private assetService: IAssetService | null = null;
  private configs = new Map<string, ConfigRecord>();
  private configSchemas = new Map<string, ConfigSchema>();
  private loadingConfigs = new Map<string, Promise<void>>();

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async loadConfig(configName: string): Promise<void> {
    const existing = this.configs.get(configName);
    if (existing) {
      return;
    }
    const pending = this.loadingConfigs.get(configName);
    if (pending) {
      return pending;
    }

    const loadPromise = this.doLoadConfig(configName);
    this.loadingConfigs.set(configName, loadPromise);
    try {
      await loadPromise;
    } finally {
      this.loadingConfigs.delete(configName);
    }
  }

  getConfig<T>(configName: string): T {
    const record = this.configs.get(configName);
    if (!record) {
      throw new Error(`配置未加载: ${configName}`);
    }
    return record.data as T;
  }

  getConfigById<T>(configName: string, id: string): T | null {
    const record = this.configs.get(configName);
    if (!record) {
      return null;
    }
    return (record.index.get(id) as T) ?? null;
  }

  getAllConfig<T>(configName: string): T[] {
    const record = this.configs.get(configName);
    if (!record) {
      return [];
    }
    const data = record.data;
    if (Array.isArray(data)) {
      return data as T[];
    }
    return [];
  }

  isLoaded(configName: string): boolean {
    return this.configs.has(configName);
  }

  validateAll(): ValidationResult[] {
    const results: ValidationResult[] = [];
    for (const [name, record] of Array.from(this.configs.entries())) {
      const schema = this.configSchemas.get(name);
      if (schema) {
        results.push(this.validateConfig(schema, record.data));
      } else {
        results.push({
          configName: name,
          isValid: true,
          errors: [],
        });
      }
    }
    return results;
  }

  registerSchema(schema: ConfigSchema): void {
    this.configSchemas.set(schema.name, schema);
    this.logger.debug(LOGGER_TAG, `注册配置 Schema: ${schema.name} v${schema.version}`);
  }

  private async doLoadConfig(configName: string): Promise<void> {
    if (!this.assetService) {
      this.assetService = ServiceRegistry.get<IAssetService>(SERVICE_TOKENS.ASSET_SERVICE);
    }

    const schema = this.configSchemas.get(configName);
    const bundleName = schema ? this.getBundleForConfig(configName) : 'resources';
    const path = `config/${configName}`;

    try {
      const jsonAsset = await this.assetService.loadJson(bundleName, path);
      const data = jsonAsset.json;

      const parsed = this.parseConfig(data, configName);

      if (schema) {
        const result = this.validateConfig(schema, parsed);
        if (!result.isValid) {
          if (DEBUG) {
            for (const err of result.errors) {
              this.logger.error(
                LOGGER_TAG,
                `配置校验失败 [${configName}] ${err.type}: ${err.message}`
              );
            }
            throw new Error(`配置校验失败: ${configName}`);
          }
          for (const err of result.errors) {
            this.logger.warn(
              LOGGER_TAG,
              `配置校验警告 [${configName}] ${err.type}: ${err.message}`
            );
          }
        }
      }

      this.freezeData(parsed);

      const index = this.buildIndex(parsed, schema);
      this.configs.set(configName, {
        name: configName,
        data: parsed,
        index,
        loadedAt: Date.now(),
      });

      this.logger.info(LOGGER_TAG, `配置已加载: ${configName}`);
    } catch (error) {
      this.logger.error(LOGGER_TAG, `配置加载失败: ${configName}`, error);
      throw error;
    }
  }

  private parseConfig(json: unknown, configName: string): unknown {
    if (typeof json !== 'object' || json === null) {
      throw new Error(`配置格式无效: ${configName}`);
    }
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj)) {
      return obj;
    }
    const itemsKey = this.findItemsKey(obj);
    if (itemsKey) {
      return obj[itemsKey];
    }
    return obj;
  }

  private findItemsKey(obj: Record<string, unknown>): string | null {
    const possibleKeys = [
      'items',
      'levels',
      'characters',
      'shop',
      'story',
      'achievements',
      'views',
    ];
    for (const key of possibleKeys) {
      if (key in obj && Array.isArray(obj[key])) {
        return key;
      }
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        return key;
      }
    }
    return null;
  }

  private validateConfig(schema: ConfigSchema, data: unknown): ValidationResult {
    const errors: ConfigError[] = [];

    if (!Array.isArray(data)) {
      errors.push({
        type: 'invalid_type',
        field: 'root',
        message: `配置数据应为数组，实际为 ${typeof data}`,
      });
      return { configName: schema.name, isValid: false, errors };
    }

    const seenIds = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, unknown>;
      if (typeof item !== 'object' || item === null) {
        errors.push({
          type: 'invalid_type',
          field: `[${i}]`,
          message: `配置项应为对象，实际为 ${typeof item}`,
        });
        continue;
      }

      for (const field of schema.fields) {
        const value = item[field.name];

        if (field.required && (value === undefined || value === null)) {
          errors.push({
            type: 'missing_field',
            field: field.name,
            id: String(item[schema.idField] ?? i),
            message: `必填字段缺失: ${field.name}`,
          });
          continue;
        }

        if (value !== undefined && value !== null) {
          if (!this.checkFieldType(value, field.type)) {
            errors.push({
              type: 'invalid_type',
              field: field.name,
              id: String(item[schema.idField] ?? i),
              message: `字段类型不匹配: ${field.name} 期望 ${field.type}，实际 ${typeof value}`,
            });
          }
        }
      }

      const idValue = item[schema.idField];
      if (typeof idValue === 'string') {
        if (seenIds.has(idValue)) {
          errors.push({
            type: 'duplicate_id',
            field: schema.idField,
            id: idValue,
            message: `重复 ID: ${idValue}`,
          });
        }
        seenIds.add(idValue);
      }
    }

    for (const ref of schema.references) {
      const refConfig = this.configs.get(ref.refConfig);
      if (!refConfig) {
        continue;
      }
      for (const item of data as Record<string, unknown>[]) {
        const refValue = item[ref.field];
        if (typeof refValue === 'string') {
          if (!refConfig.index.has(refValue)) {
            errors.push({
              type: 'invalid_reference',
              field: ref.field,
              id: String(item[schema.idField] ?? ''),
              message: `引用不存在: ${ref.field} → ${ref.refConfig}.${ref.refField} = ${refValue}`,
            });
          }
        }
      }
    }

    return {
      configName: schema.name,
      isValid: errors.length === 0,
      errors,
    };
  }

  private checkFieldType(value: unknown, expectedType: SchemaField['type']): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private buildIndex(data: unknown, schema: ConfigSchema | undefined): Map<string, unknown> {
    const index = new Map<string, unknown>();
    if (!Array.isArray(data) || !schema) {
      return index;
    }
    for (const item of data as Record<string, unknown>[]) {
      const id = item[schema.idField];
      if (typeof id === 'string') {
        index.set(id, item);
      }
    }
    return index;
  }

  private freezeData(data: unknown): void {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (typeof item === 'object' && item !== null) {
          Object.freeze(item);
        }
      }
      Object.freeze(data);
    } else if (typeof data === 'object' && data !== null) {
      Object.freeze(data);
    }
  }

  private getBundleForConfig(configName: string): string {
    if (configName === 'views' || configName === 'ui_layout') {
      return 'resources';
    }
    return 'gameplay_base';
  }
}
