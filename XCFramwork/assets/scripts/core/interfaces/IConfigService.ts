export interface ConfigSchema {
  name: string;
  version: number;
  fields: SchemaField[];
  idField: string;
  references: SchemaReference[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
}

export interface SchemaReference {
  field: string;
  refConfig: string;
  refField: string;
}

export interface ValidationResult {
  configName: string;
  isValid: boolean;
  errors: ConfigError[];
}

export interface ConfigError {
  type: 'missing_field' | 'duplicate_id' | 'invalid_reference' | 'invalid_type';
  field: string;
  id?: string;
  message: string;
}

export interface IConfigService {
  loadConfig(configName: string): Promise<void>;
  getConfig<T>(configName: string): T;
  getConfigById<T>(configName: string, id: string): T | null;
  getAllConfig<T>(configName: string): T[];
  isLoaded(configName: string): boolean;
  validateAll(): ValidationResult[];
  registerSchema(schema: ConfigSchema): void;
}
