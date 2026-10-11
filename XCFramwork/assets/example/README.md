# XCFramwork 使用示例

本目录包含 7 个示例，演示如何使用框架的核心服务。每个示例都是独立的 Cocos Component 脚本，可以挂载到场景节点上运行。

## 前置条件

所有示例都依赖框架服务已通过 `GameBootstrap` 初始化。请确保场景中已挂载 `GameBootstrap` 组件并完成启动流程。

## 示例列表

| 示例            | 文件                     | 演示内容                                                                  |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| 1. EventBus     | `EventBusExample.ts`     | 事件订阅(on)、一次性订阅(once)、发布(emit)、取消订阅(off/offByTarget)     |
| 2. UIManager    | `UIManagerExample.ts`    | 弹窗打开(open)、关闭(close)、关闭全部(closeAll)                           |
| 3. SaveService  | `SaveServiceExample.ts`  | 存档保存(save)、读取(load)、删除(deleteSave)、版本迁移(registerMigration) |
| 4. AudioManager | `AudioManagerExample.ts` | 音乐播放(playMusic)、音效播放(playSfx)、音量控制(setVolume)               |
| 5. Localization | `LocalizationExample.ts` | 文本获取(getText)、语言切换(setLanguage)、数字/日期格式化                 |
| 6. TimerManager | `TimerManagerExample.ts` | 延迟(delay)、循环(interval)、倒计时(countdown)、取消(cancelByOwner)       |
| 7. PoolManager  | `PoolManagerExample.ts`  | 注册(register)、获取(get)、释放(release)、池信息(getPoolInfo)             |
| - Scene Setup   | `ExampleSceneSetup.ts`   | 自动创建示例场景（标签切换、UI 生成、组件挂载）                           |

## 使用方式

### 方式一：使用 ExampleSceneSetup 自动创建场景（推荐）

1. 在 Cocos Creator 中打开 `XCFramwork/` 工程
2. 新建一个空场景
3. 在场景根节点上挂载 `GameBootstrap` 组件（确保服务初始化）
4. 创建一个空节点，挂载 `ExampleSceneSetup` 组件
5. 运行场景 —— 所有 UI 元素和示例组件会自动生成

`ExampleSceneSetup` 会在运行时动态创建：

- 顶部标题栏
- 7 个标签按钮（切换不同示例面板）
- 每个示例对应的操作按钮、滑块、开关等 UI 元素
- 底部日志输出区域

点击顶部标签即可切换到对应示例面板进行交互演示。

### 方式二：手动挂载示例组件

1. 在 Cocos Creator 中打开 `XCFramwork/` 工程
2. 创建场景并挂载 `GameBootstrap` 组件
3. 创建节点并挂载示例组件
4. 在属性面板中绑定 UI 组件（Label、Button、Slider 等）
5. 运行场景，通过按钮交互演示框架功能

## 导入路径说明

示例文件位于 `XCFramwork/assets/example/` 下，通过相对路径导入框架代码：

```typescript
import { SERVICE_TOKENS } from '../scripts/core/interfaces/ServiceTokens';
import { ServiceRegistry } from '../scripts/app/ServiceRegistry';
```

## 服务获取模式

所有示例使用统一的服务获取模式：

```typescript
// 通过 ServiceRegistry 获取服务实例
const eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);

// 使用 try-catch 处理服务未注册的情况
try {
  this.eventBus = ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
} catch {
  this.eventBus = null;
  this.log('EventBus 未注册');
}
```

## 生命周期清理

所有示例在 `onDestroy` 中清理资源：

- EventBus 示例：`offByTarget(this)` 取消所有订阅
- TimerManager 示例：`cancelByOwner(this)` 取消所有定时器
- UIManager 示例：取消按钮事件监听
- AudioManager 示例：取消滑块事件监听
