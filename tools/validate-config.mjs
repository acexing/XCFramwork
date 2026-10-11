import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT_DIR = process.argv[2] ?? '.';
const CONFIG_DIR = join(ROOT_DIR, 'XCFramwork/assets/resources/config');
const SCRIPTS_DIR = join(ROOT_DIR, 'XCFramwork/assets/scripts');

let passedCount = 0;
let failedCount = 0;
const warnings = [];

function pass(msg) {
  passedCount++;
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  failedCount++;
  console.error(`  ✗ ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.warn(`  ⚠ ${msg}`);
}

console.log('=== 资源路径/配置 ID 校验工具 ===\n');

console.log('[1] 检查配置文件是否存在');
const requiredConfigs = [
  'views.json',
  'items.json',
  'levels.json',
  'localization_zh.json',
  'localization_en.json',
  'hotupdate.json',
];
for (const config of requiredConfigs) {
  const path = join(CONFIG_DIR, config);
  if (existsSync(path)) {
    pass(`${config} 存在`);
  } else {
    fail(`${config} 不存在`);
  }
}

console.log('\n[2] 检查配置文件 JSON 格式');
for (const config of requiredConfigs) {
  const path = join(CONFIG_DIR, config);
  if (!existsSync(path)) continue;
  try {
    JSON.parse(readFileSync(path, 'utf-8'));
    pass(`${config} JSON 格式正确`);
  } catch (e) {
    fail(`${config} JSON 格式错误: ${e.message}`);
  }
}

console.log('\n[3] 检查 items.json 配置 ID 唯一性');
const itemsPath = join(CONFIG_DIR, 'items.json');
if (existsSync(itemsPath)) {
  try {
    const items = JSON.parse(readFileSync(itemsPath, 'utf-8'));
    if (Array.isArray(items)) {
      const ids = items.map((item) => item.id).filter((id) => id !== undefined);
      const uniqueIds = new Set(ids);
      if (ids.length === uniqueIds.size) {
        pass(`items.json ID 唯一 (${ids.length} 个)`);
      } else {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        fail(`items.json 有重复 ID: ${duplicates.join(', ')}`);
      }
    } else {
      warn('items.json 不是数组格式');
    }
  } catch (e) {
    fail(`items.json 解析失败: ${e.message}`);
  }
}

console.log('\n[4] 检查 levels.json 配置 ID 唯一性');
const levelsPath = join(CONFIG_DIR, 'levels.json');
if (existsSync(levelsPath)) {
  try {
    const levels = JSON.parse(readFileSync(levelsPath, 'utf-8'));
    if (Array.isArray(levels)) {
      const ids = levels.map((level) => level.id).filter((id) => id !== undefined);
      const uniqueIds = new Set(ids);
      if (ids.length === uniqueIds.size) {
        pass(`levels.json ID 唯一 (${ids.length} 个)`);
      } else {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        fail(`levels.json 有重复 ID: ${duplicates.join(', ')}`);
      }
    } else {
      warn('levels.json 不是数组格式');
    }
  } catch (e) {
    fail(`levels.json 解析失败: ${e.message}`);
  }
}

console.log('\n[5] 检查 views.json 视图配置完整性');
const viewsPath = join(CONFIG_DIR, 'views.json');
if (existsSync(viewsPath)) {
  try {
    const views = JSON.parse(readFileSync(viewsPath, 'utf-8'));
    if (Array.isArray(views)) {
      const requiredFields = ['viewId', 'type'];
      let allValid = true;
      for (const view of views) {
        for (const field of requiredFields) {
          if (view[field] === undefined) {
            fail(`views.json 视图缺少字段 ${field}: ${JSON.stringify(view)}`);
            allValid = false;
          }
        }
      }
      if (allValid) {
        pass(`views.json 所有视图包含必需字段 (${views.length} 个视图)`);
      }
    } else {
      warn('views.json 不是数组格式');
    }
  } catch (e) {
    fail(`views.json 解析失败: ${e.message}`);
  }
}

console.log('\n[6] 检查本地化文本表 key 一致性');
const zhPath = join(CONFIG_DIR, 'localization_zh.json');
const enPath = join(CONFIG_DIR, 'localization_en.json');
if (existsSync(zhPath) && existsSync(enPath)) {
  try {
    const zhData = JSON.parse(readFileSync(zhPath, 'utf-8'));
    const enData = JSON.parse(readFileSync(enPath, 'utf-8'));

    function flattenKeys(obj, prefix = '') {
      const keys = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...flattenKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const zhKeys = new Set(flattenKeys(zhData));
    const enKeys = new Set(flattenKeys(enData));

    const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k));
    const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k));

    if (missingInEn.length === 0 && missingInZh.length === 0) {
      pass(`本地化 key 一致 (${zhKeys.size} 个 key)`);
    } else {
      if (missingInEn.length > 0) {
        fail(`en 缺少 key: ${missingInEn.join(', ')}`);
      }
      if (missingInZh.length > 0) {
        fail(`zh 缺少 key: ${missingInZh.join(', ')}`);
      }
    }
  } catch (e) {
    fail(`本地化文本表解析失败: ${e.message}`);
  }
}

console.log('\n[7] 检查脚本文件命名规范');
function scanScripts(dir) {
  const violations = [];
  function scan(d) {
    const entries = readdirSync(d);
    for (const entry of entries) {
      const fullPath = join(d, entry);
      if (statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (extname(entry) === '.ts') {
        if (!/^[A-Z][A-Za-z0-9]*\.ts$/.test(entry) && !/^[I][A-Z][A-Za-z0-9]*\.ts$/.test(entry)) {
          if (!entry.startsWith('L10n')) {
            violations.push(entry);
          }
        }
      }
    }
  }
  scan(dir);
  return violations;
}

const namingViolations = scanScripts(SCRIPTS_DIR);
if (namingViolations.length === 0) {
  pass('所有脚本文件命名符合 PascalCase 规范');
} else {
  warn(`命名不规范: ${namingViolations.join(', ')}`);
}

console.log('\n[8] 检查 SERVICE_TOKENS 一致性');
const tokensPath = join(SCRIPTS_DIR, 'core/interfaces/ServiceTokens.ts');
if (existsSync(tokensPath)) {
  const content = readFileSync(tokensPath, 'utf-8');
  const tokenMatches = content.match(/(\w+):\s*'(\w+)'/g) || [];
  let allConsistent = true;
  for (const match of tokenMatches) {
    const parts = match.match(/(\w+):\s*'(\w+)'/);
    if (parts && parts[1] !== parts[2]) {
      fail(`SERVICE_TOKENS 不一致: ${parts[1]} !== '${parts[2]}'`);
      allConsistent = false;
    }
  }
  if (allConsistent) {
    pass(`SERVICE_TOKENS 所有 token 名称一致 (${tokenMatches.length} 个)`);
  }
}

console.log('\n[9] 检查关键接口文件存在');
const requiredInterfaces = [
  'ILogger.ts',
  'IErrorHandler.ts',
  'IEventBus.ts',
  'IAssetService.ts',
  'IUIManager.ts',
  'IAudioManager.ts',
  'ISaveService.ts',
  'IConfigService.ts',
  'IPlatformAdapter.ts',
  'IPlatformService.ts',
  'IStorageAdapter.ts',
  'ITimerManager.ts',
  'IPoolManager.ts',
  'ILocalizationService.ts',
  'IPerformanceMonitor.ts',
  'IDebugPanel.ts',
  'IHotUpdateService.ts',
  'IHotUpdateAdapter.ts',
  'ServiceTokens.ts',
  'IGameBootstrap.ts',
  'IGameConfig.ts',
  'ISceneService.ts',
  'AssetPaths.ts',
  'LocalizationKeys.ts',
];

const interfacesDir = join(SCRIPTS_DIR, 'core/interfaces');
for (const iface of requiredInterfaces) {
  const path = join(interfacesDir, iface);
  if (existsSync(path)) {
    pass(`${iface} 存在`);
  } else {
    fail(`${iface} 不存在`);
  }
}

console.log('\n========================================');
console.log(`校验结果: ${passedCount} passed, ${failedCount} failed, ${warnings.length} warnings`);
console.log('========================================');

if (failedCount > 0) {
  process.exit(1);
}
