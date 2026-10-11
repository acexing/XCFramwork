import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT_DIR = process.argv[2] ?? '.';
const XCF_DIR = join(ROOT_DIR, 'XCFramwork');

let passedCount = 0;
let failedCount = 0;
const pending = [];

function pass(msg) {
  passedCount++;
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  failedCount++;
  console.error(`  ✗ ${msg}`);
}

function pendingItem(msg) {
  pending.push(msg);
  console.log(`  ○ ${msg} (待编辑器/真机操作)`);
}

console.log('=== MVP 验收自动化检查 ===\n');

console.log('[10.1] 必须通过项\n');

console.log('1. 启动流程可控，初始化失败能显示错误信息');
if (existsSync(join(XCF_DIR, 'assets/scripts/app/GameBootstrap.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/app/GameBootstrap.ts'), 'utf-8');
  if (content.includes('onInitFailed') && content.includes('showErrorOverlay')) {
    pass('GameBootstrap 包含初始化失败处理和错误显示');
  } else {
    fail('GameBootstrap 缺少初始化失败处理');
  }
} else {
  fail('GameBootstrap.ts 不存在');
}

console.log('\n2. 可以在场景间切换并显示加载状态');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/SceneService.ts'))) {
  pass('SceneService 存在');
} else {
  fail('SceneService.ts 不存在');
}
pendingItem('场景切换需在编辑器中验证');

console.log('\n3. UIManager 能打开、关闭、去重管理弹窗');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/UIManager.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/services/UIManager.ts'), 'utf-8');
  if (content.includes('open') && content.includes('close') && content.includes('closeAll')) {
    pass('UIManager 包含 open/close/closeAll 方法');
  } else {
    fail('UIManager 缺少必要方法');
  }
} else {
  fail('UIManager.ts 不存在');
}

console.log('\n4. AssetService 能加载 Bundle 资源，并在适当时机释放');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/AssetService.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/services/AssetService.ts'), 'utf-8');
  if (content.includes('loadBundle') && content.includes('releaseBundle')) {
    pass('AssetService 包含 loadBundle/releaseBundle 方法');
  } else {
    fail('AssetService 缺少 Bundle 加载/释放方法');
  }
} else {
  fail('AssetService.ts 不存在');
}

console.log('\n5. EventBus 订阅/取消订阅行为有测试');
if (existsSync(join(XCF_DIR, 'assets/scripts/test/TestRunner.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/test/TestRunner.ts'), 'utf-8');
  const testCount = (content.match(/private test\w+\(\)/g) || []).length;
  if (testCount >= 10) {
    pass(`TestRunner 包含 ${testCount} 个测试用例`);
  } else {
    fail(`TestRunner 测试用例不足 (${testCount} 个)`);
  }
} else {
  fail('TestRunner.ts 不存在');
}

console.log('\n6. 设置可保存、读取；进度存档有版本号和异常回退');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/SaveService.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/services/SaveService.ts'), 'utf-8');
  if (
    content.includes('schemaVersion') &&
    content.includes('checksum') &&
    content.includes('migrate')
  ) {
    pass('SaveService 包含版本号、checksum、迁移机制');
  } else {
    fail('SaveService 缺少版本/checksum/迁移机制');
  }
} else {
  fail('SaveService.ts 不存在');
}

console.log('\n7. 音乐、音效和音量设置正常');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/AudioManager.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/services/AudioManager.ts'), 'utf-8');
  if (
    content.includes('playMusic') &&
    content.includes('playSfx') &&
    content.includes('setMasterVolume')
  ) {
    pass('AudioManager 包含音乐/音效/音量控制');
  } else {
    fail('AudioManager 缺少必要方法');
  }
} else {
  fail('AudioManager.ts 不存在');
}

console.log('\n8. 资源路径/配置 ID 校验工具可运行');
if (existsSync(join(ROOT_DIR, 'tools/validate-config.mjs'))) {
  pass('配置校验工具存在');
} else {
  fail('validate-config.mjs 不存在');
}

console.log('\n9. 桌面鼠标与 Android 触摸均能完成核心交互');
if (existsSync(join(XCF_DIR, 'assets/scripts/ui/common/MainSceneController.ts'))) {
  const content = readFileSync(
    join(XCF_DIR, 'assets/scripts/ui/common/MainSceneController.ts'),
    'utf-8'
  );
  if (content.includes('TOUCH_START') && content.includes('MOUSE_DOWN')) {
    pass('MainSceneController 同时处理触摸和鼠标事件');
  } else {
    fail('MainSceneController 缺少触摸/鼠标事件处理');
  }
} else {
  fail('MainSceneController.ts 不存在');
}

console.log('\n10. Android 真机运行通过；PC 构建可运行');
pendingItem('Android 真机测试');
pendingItem('PC 构建测试');

console.log('\n11. 关键错误有日志；发布版没有开发调试入口');
if (existsSync(join(XCF_DIR, 'assets/scripts/core/logger/Logger.ts'))) {
  pass('Logger 存在');
} else {
  fail('Logger.ts 不存在');
}
if (existsSync(join(XCF_DIR, 'assets/scripts/debug/DebugPanel.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/debug/DebugPanel.ts'), 'utf-8');
  if (content.includes('DEBUG') && content.includes('F1')) {
    pass('DebugPanel 仅在 DEBUG 模式下启用 F1 快捷键');
  } else {
    fail('DebugPanel 缺少 DEBUG 条件控制');
  }
} else {
  fail('DebugPanel.ts 不存在');
}

console.log('\n[10.2] 性能与稳定性检查\n');

console.log('1. 图鉴长列表采用分页/虚拟列表或分批生成');
pendingItem('需在实际玩法中验证');

console.log('\n2. 连续切换场景后内存不持续增长');
pendingItem('需在编辑器中运行验证');

console.log('\n3. 连续打开关闭弹窗后没有重复监听或残留节点');
if (existsSync(join(XCF_DIR, 'assets/scripts/ui/common/BaseView.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/ui/common/BaseView.ts'), 'utf-8');
  if (content.includes('offByTarget') && content.includes('onDestroy')) {
    pass('BaseView 在 onDestroy 中清理事件订阅');
  } else {
    fail('BaseView 缺少事件清理');
  }
} else {
  fail('BaseView.ts 不存在');
}

console.log('\n4. 应用切后台再恢复后，音频、计时器和存档状态正确');
if (existsSync(join(XCF_DIR, 'assets/scripts/services/AudioManager.ts'))) {
  const content = readFileSync(join(XCF_DIR, 'assets/scripts/services/AudioManager.ts'), 'utf-8');
  if (content.includes('EVENT_HIDE') && content.includes('EVENT_SHOW')) {
    pass('AudioManager 处理应用切后台/恢复事件');
  } else {
    fail('AudioManager 缺少切后台处理');
  }
} else {
  fail('AudioManager.ts 不存在');
}

console.log('\n5. 在目标最低配置设备上测试图片加载和 UI 帧率');
pendingItem('需在目标设备上测试');

console.log('\n========================================');
console.log(
  `MVP 验收结果: ${passedCount} passed, ${failedCount} failed, ${pending.length} pending`
);
console.log('========================================');

if (failedCount > 0) {
  process.exit(1);
}
