# Cocos Creator 3.x 跨平台游戏基础框架方案

> 版本：1.0\
> 日期：2026-10-09\
> 目标：建立一套可复用的 TypeScript 游戏基础框架，支持 PC / Steam 与
> Android，适用于休闲游戏、剧情游戏、图鉴收集、模拟经营等项目。\
> 建议引擎基线：**Cocos Creator 3.8
> LTS**（新项目应在正式开工时再核对当前维护版本与平台要求，并固定具体小版本）。

------------------------------------------------------------------------

## 1. 方案结论

建议采用 **"轻量自研核心 + Cocos Creator 原生能力 + 按需接入成熟插件"**
的方案，而不是一开始引入一个庞大、强耦合的全家桶框架。

框架目标：

1.  **业务与引擎解耦**：核心数据、配置、存档和玩法规则尽量不依赖场景节点。
2.  **平台适配统一**：Steam / 桌面端与 Android
    的输入、存档路径、支付/成就等差异通过 Adapter 隔离。
3.  **资源按需加载**：使用 Asset
    Bundle、资源目录规范和显式释放策略，避免启动时一次性加载全部内容。
4.  **可配置、可扩展**：角色、关卡、剧情、商品、奖励等尽可能由
    JSON/表格配置驱动。
5.  **开发期可观测**：提供日志、错误上报接口、调试面板、性能指标与资源检查工具。
6.  **小步落地**：先完成一个可运行的基础 Demo，再逐项接入
    Steamworks、分析、云存档等平台功能。

### 推荐技术栈

  --------------------------------------------------------------------------------
  层                                  建议
  ----------------------------------- --------------------------------------------
  引擎                                Cocos Creator 3.8 LTS，项目固定具体版本

  语言                                TypeScript，启用严格类型检查并统一代码风格

  UI                                  Cocos Creator 原生 UI 节点与组件；大型复杂
                                      UI 可评估 FairyGUI

  配置                                JSON + 类型定义；表格导出工具可后续接入

  本地存档                            `sys.localStorage`
                                      用于轻量设置；重要进度使用版本化存档
                                      Adapter，按目标原生平台验证持久化与路径

  资源                                Asset Manager / Asset
                                      Bundle，资源加载服务统一封装

  音频                                引擎音频 API 外包一层 AudioManager

  自动化                              ESLint + Prettier + TypeScript
                                      检查；按项目规模增加单元测试

  Steam                               通过原生插件/桥接接入
                                      Steamworks；具体插件兼容性需针对 Creator
                                      版本、操作系统与构建方式验证

  Android                             原生构建链路与设备真机测试；渠道 SDK
                                      通过平台 Adapter 接入
  --------------------------------------------------------------------------------

------------------------------------------------------------------------

## 2. 框架参考与借鉴边界

### 2.1 Cocos Creator 官方能力

-   **Asset Bundle / Asset
    Manager**：按模块划分资源，按需加载和释放，减少初始加载压力。
-   **Director /
    Scene**：使用引擎的场景流程能力；框架只增加统一的场景切换接口、加载遮罩和切换前后钩子。
-   **事件系统**：引擎事件用于节点交互；跨系统事件建议封装成带类型定义的
    EventBus，并明确订阅者生命周期。
-   **原生平台构建能力**：PC/Steam 与 Android 的构建、文件访问和第三方
    SDK 需要分别验证，不应假设 Web API 在所有原生环境都可用。

官方文档： - Cocos Creator 3.8
用户手册：https://docs.cocos.com/creator/3.8/manual/zh/ - Asset Bundle
介绍：https://docs.cocos.com/creator/3.8/zh/asset/bundle.html - Director
API：https://docs.cocos.com/creator/3.8/api/en/class/Director

### 2.2 开源框架参考：ccc-tnt-framework

GitHub：https://github.com/onvia/ccc-tnt-framework

该项目文档覆盖资源、场景、弹窗、事件、音效、网络、对象池、拖放、多语言、热更新和编辑器工具等常见模块。建议把它作为**模块清单和实现思路参考**，先逐个评估代码、许可证、Creator
版本兼容性与维护状态，再决定直接使用、改造或仅借鉴。不要未经审查直接复制整个框架。

### 2.3 选型原则

-   不重复造引擎已有的轮子：场景、节点、基础动画、资源加载优先使用引擎能力。
-   不为了"框架完整"而预先开发未被项目需要的模块。
-   第三方插件必须检查：许可证、最近维护时间、Creator
    版本、原生平台支持、是否有示例工程、是否与现有依赖冲突。
-   Steamworks、Android 渠道
    SDK、云存档和热更新属于平台/产品能力，不应与基础核心强绑定。

------------------------------------------------------------------------

## 3. 总体架构

``` text
┌──────────────────────────────────────────┐
│                 游戏业务层                │
│ 主玩法 / 关卡 / 剧情 / 角色 / 图鉴 / 商店  │
└────────────────────┬─────────────────────┘
                     │ 调用服务、订阅事件
┌────────────────────▼─────────────────────┐
│                 应用服务层                │
│ GameFlow / UI / Audio / Asset / Save      │
│ Config / EventBus / Timer / Pool / Locale │
│ Analytics / Platform / Debug              │
└────────────────────┬─────────────────────┘
                     │ 通过接口依赖
┌────────────────────▼─────────────────────┐
│                 基础与适配层               │
│ Cocos Adapter / Steam Adapter / Android   │
│ Storage Adapter / Logger / Error Handler  │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────▼─────────────────────┐
│       Cocos Creator Engine + Native       │
└──────────────────────────────────────────┘
```

### 依赖规则

1.  业务模块可以依赖应用服务接口，不能直接操作其他业务模块的内部节点。
2.  核心数据与玩法规则不直接引用 `Node`、`Component` 或具体 UI 控件。
3.  平台差异集中在
    `platform/`；业务代码通过接口调用，不在业务代码里到处写平台判断。
4.  服务的初始化顺序必须显式定义；禁止依赖文件加载顺序或隐式全局变量。
5.  事件只用于解耦通知；有返回值、需要确认结果的操作应使用明确的方法调用。
6.  所有异步加载、存档、平台调用都应有错误处理、超时/失败回退策略（适用时）和日志。

------------------------------------------------------------------------

## 4. 推荐目录结构

以下结构适合作为项目初始模板；不要求第一天就创建所有空目录。

``` text
assets/
├── scenes/
│   ├── Boot.scene
│   ├── Loading.scene
│   └── Main.scene
├── scripts/
│   ├── app/
│   │   ├── GameBootstrap.ts
│   │   ├── GameConfig.ts
│   │   └── ServiceRegistry.ts
│   ├── core/
│   │   ├── interfaces/
│   │   ├── events/
│   │   ├── logger/
│   │   ├── errors/
│   │   └── utils/
│   ├── services/
│   │   ├── AssetService.ts
│   │   ├── SceneService.ts
│   │   ├── UIManager.ts
│   │   ├── AudioManager.ts
│   │   ├── EventBus.ts
│   │   ├── TimerManager.ts
│   │   ├── PoolManager.ts
│   │   ├── ConfigService.ts
│   │   ├── SaveService.ts
│   │   ├── LocalizationService.ts
│   │   └── PlatformService.ts
│   ├── platform/
│   │   ├── IPlatformAdapter.ts
│   │   ├── DesktopAdapter.ts
│   │   ├── AndroidAdapter.ts
│   │   └── SteamAdapter.ts
│   ├── gameplay/
│   │   ├── models/
│   │   ├── systems/
│   │   └── views/
│   ├── ui/
│   │   ├── common/
│   │   └── screens/
│   └── debug/
│       ├── DebugPanel.ts
│       └── PerformanceMonitor.ts
├── resources/
│   └── config/                 # 只放确实需要通过 resources 路径访问的资源
├── bundles/
│   ├── core/
│   ├── ui_common/
│   ├── gameplay_base/
│   ├── chapter_01/
│   └── gallery/
├── data/
│   ├── config/
│   └── localization/
└── prefabs/
    ├── ui/
    └── effects/

extensions/                      # 可选：编辑器工具
tests/                           # 可选：逻辑测试
docs/
└── architecture/
```

**注意：** `assets/` 是 Creator 工程资源目录，实际 Bundle
目录和配置方式应按所用 Creator 小版本配置。不要把大量图片无差别塞进
`resources` 并在启动时 `loadDir`。

------------------------------------------------------------------------

## 5. 基础管理模块设计

### 5.1 GameBootstrap / ServiceRegistry

**职责** - 启动时按顺序初始化基础服务。 - 检查必要配置和版本。 - 进入
Boot → Loading → Main 的启动流程。 -
统一处理初始化失败，展示可理解的错误提示。

**建议初始化顺序** 1. Logger / ErrorHandler 2. GameConfig /
PlatformAdapter 3. ConfigService 4. SaveService（读取存档与迁移） 5.
AudioManager 6. AssetService / UIManager 7. LocalizationService 8.
业务模块 9. 进入主场景

不要把所有功能都写在一个 `GameManager` 单例里。Bootstrap
只负责编排，具体功能由独立服务负责。

### 5.2 SceneService 场景管理

功能： - 场景切换入口统一化。 - 切换前后回调、加载遮罩、进度展示。 -
防止短时间重复触发同一切换。 - 切换失败时记录日志并回退到安全场景。 -
进入场景时加载所需 Bundle，离开时根据引用策略释放资源。

约束： - 仍以 Cocos `director` 为底层能力，不重新实现场景系统。 -
业务层调用 `sceneService.goto('Main')`，不要到处直接调用
`director.loadScene()`。 -
场景名建议使用枚举或字面量联合类型，避免散落字符串。

### 5.3 UIManager 弹窗与界面管理

功能： - `open` / `close` / `closeAll` / `get`。 -
支持全屏页面、普通弹窗、提示、加载界面等类型。 - 维护 UI
层级：背景层、页面层、弹窗层、提示层、系统层。 -
防止同一弹窗重复打开；支持参数传入和关闭回调。 -
页面关闭时注销事件、停止动画、释放临时引用。 -
统一处理分辨率适配、安全区域、键盘/返回键行为。

建议： - UI Prefab 由 AssetService
加载，不允许每个页面自行维护一套不一致的加载逻辑。 - 重要 UI
状态应由模型/服务提供，避免页面之间直接互相改控件。 - 定义统一的
`BaseView`
生命周期：`onOpen(data)`、`onShow()`、`onHide()`、`onClose()`。

### 5.4 AssetService 资源管理

功能： - Bundle 加载、资源加载、预加载、缓存和释放。 -
提供统一的加载进度与失败回调。 -
统计资源引用/加载情况，开发版记录加载耗时。 -
约定资源路径，避免业务代码拼接任意字符串。

建议 API（示意）： - `loadBundle(name)` - `loadPrefab(bundle, path)` -
`loadSpriteFrame(bundle, path)` - `preloadGroup(bundle, paths)` -
`releaseBundle(bundle)` - `getStats()`

注意： - Cocos
的资源依赖与释放规则需要遵循引擎规范；不要简单地在切场景后无差别
`releaseAll()`。 -
对频繁使用的资源设置清晰的生命周期；对大型图片按需加载并在不再使用时释放。 -
3000
张以上图片的项目应采用资源索引、分页/分组、缩略图与原图分离、按需加载，而不是把全部原图常驻内存。

### 5.5 EventBus 事件管理

功能： - 统一事件命名与类型定义。 - 支持 `on`、`once`、`off`、`emit`。 -
订阅者在组件销毁或页面关闭时解除订阅。 -
开发版可以打印事件名和触发次数。

建议规则： - 事件名集中定义，例如 `GameEvent.CurrencyChanged`。 -
事件参数使用明确的 TypeScript 类型。 -
禁止匿名订阅后无法取消的长期监听。 -
不把所有函数调用都改成事件；需要结果的操作使用服务方法。

### 5.6 AudioManager 音频管理

功能： - 背景音乐、音效、环境音分组。 -
主音量、音乐音量、音效音量设置。 - 场景切换音乐策略、淡入淡出。 -
防止按钮音效重复播放；可配置音效并发上限。 - 读取/保存音频设置。

### 5.7 SaveService 存档管理

建议存档结构：

``` ts
interface SaveEnvelope<T> {
  schemaVersion: number;
  savedAt: number;
  checksum?: string;
  data: T;
}
```

功能： - 自动存档与手动存档入口。 - 多槽位存档（如项目需要）。 -
存档版本号与迁移函数。 -
读取失败、版本不兼容、数据损坏时提供安全回退。 -
存档写入临时数据并验证成功后再更新正式存档（具体实现按平台文件 API
设计）。 - 设置数据与进度数据分开保存。 - 支持导入/导出存档（可选）。

**重要：** `localStorage`
适合设置、轻量数据或原型验证，不应未经验证就作为所有原生平台上大型关键存档的唯一方案。Steam
云存档也需要明确文件路径、同步冲突策略与用户关闭云同步时的行为。

### 5.8 ConfigService 配置管理

配置类别： - 静态玩法配置：关卡、商品、奖励、角色、剧情节点。 - UI
配置：界面路径、弹窗类型。 - 平台配置：能力开关、版本信息。 -
本地化文本：按语言拆分。

要求： - 配置加载时校验必填字段、唯一 ID、引用是否存在。 - 配置 ID
稳定，不要依赖数组下标。 -
配置表与运行时状态分离；不要直接修改原始配置对象。 -
复杂表格可在后续接入 CSV/Excel → JSON 的导出流程。

### 5.9 TimerManager / PoolManager

TimerManager： - 统一管理延迟任务、循环任务、暂停/恢复和取消。 -
页面/场景销毁时可以按 owner 清理对应任务。 -
对倒计时使用单一时间源，避免多个组件各自累计产生误差。

PoolManager： - 对高频短生命周期对象（飘字、粒子容器、重复 UI
项）使用对象池。 -
池对象必须有重置逻辑，回收时清理事件、动画、定时器和临时状态。 -
不要为低频对象盲目引入对象池；对象池会增加生命周期复杂度。

### 5.10 LocalizationService 本地化

功能： - 语言切换与文本表查询。 - 缺失 key 的开发期告警。 -
数字、日期和复数格式统一。 - 不把可见文本硬编码在业务脚本中。 -
首发可先支持中文，保留英文扩展路径。

### 5.11 PlatformService 平台适配

定义统一接口，业务层不直接调用平台 SDK：

``` ts
export interface IPlatformAdapter {
  getPlatformName(): string;
  quitGame(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  getCapabilities(): PlatformCapabilities;
}

export interface PlatformCapabilities {
  cloudSave: boolean;
  achievements: boolean;
  overlay: boolean;
  haptics: boolean;
}
```

Steam 适配候选能力： - 初始化 Steamworks。 -
成就、统计数据、云存档、Steam Overlay。 - 退出游戏与 Steam
生命周期处理。 - Steam SDK/第三方桥接的许可、二进制、架构与打包验证。

Android 适配候选能力： - 返回键、应用暂停/恢复。 - Android
文件访问与存档。 - 震动、分享、渠道 SDK（如确实需要）。 - Google Play
Games 等服务（如确实需要）。

桌面端（非 Steam）应有 `DesktopAdapter`，避免开发版与 Steam
版被绑死。所有平台能力都应提供"不可用"时的降级实现。

### 5.12 Logger / ErrorHandler / DebugPanel

Logger： - `debug/info/warn/error` 分级。 -
发布版可关闭高频日志，保留必要错误信息。 -
日志中避免记录令牌、隐私数据和完整用户路径。

ErrorHandler： - 捕获可恢复错误并提供友好提示。 -
重要错误包含模块、操作、版本与上下文。 - 不要静默吞掉异常。

DebugPanel（仅开发版）： - 当前场景、帧率、内存/资源统计（可获得时）。 -
打开指定页面、增加测试货币、解锁测试内容。 -
配置校验、资源路径检查、存档导入/重置。 -
发布构建必须关闭或限制调试入口。

### 5.13 Analytics / 网络模块（可选）

仅在项目确实需要时添加： - 事件统计、崩溃报告、远程配置。 -
网络请求封装、超时、重试、取消、错误码映射。 -
隐私政策、用户同意和数据最小化。 -
单机游戏不应为了"框架完整"而强制引入账号系统或后端服务。

------------------------------------------------------------------------

## 6. 面向 Steam + Android 的工程注意事项

### 6.1 输入与 UI

-   同一交互应支持鼠标、触摸；必要时支持键盘/手柄。
-   不要只依赖触摸事件；桌面端需要鼠标悬停、点击、滚轮与键盘焦点策略。
-   分辨率和宽高比变化时验证布局。
-   Android 验证刘海/安全区域、返回键、应用切后台再回来、不同 DPI。
-   Steam 验证窗口化/全屏、不同分辨率、Alt-Tab、手柄（若支持）。

### 6.2 存档与路径

-   不要硬编码安装目录为可写目录。
-   存档目录通过平台 Adapter 提供。
-   测试 Steam 云同步冲突、离线启动、用户禁用云同步。
-   Android 测试卸载、升级安装、低存储空间和应用被系统回收后的恢复行为。

### 6.3 图片资源策略

对 3000 张以上的照片/插画类资源，建议： 1. 建立唯一
`assetId`，不要把文件名直接当业务 ID。 2.
生成元数据索引：ID、Bundle、相对路径、缩略图路径、标签、解锁条件、内容分级。
3. 图鉴优先加载缩略图；打开详情后再加载高清图。 4.
按章节、角色或主题拆分 Bundle，避免启动时加载全量资源。 5.
使用分页列表/虚拟列表，避免一次创建几千个 UI 节点。 6.
统一图片压缩、尺寸和格式；分别评估 PC 与 Android 的纹理内存占用。 7.
记录资源加载、失败和释放情况；测试长时间浏览图鉴后的内存变化。 8.
确认图片素材的授权范围与发行平台内容规则。

------------------------------------------------------------------------

## 7. 服务 API 示例

以下为接口形态示意，不是可直接复制的完整实现。

``` ts
export interface ISceneService {
  goto(sceneName: string, data?: unknown): Promise<void>;
}

export interface IAssetService {
  loadPrefab(bundleName: string, path: string): Promise<Prefab>;
  preloadBundle(bundleName: string): Promise<void>;
  releaseBundle(bundleName: string): void;
}

export interface ISaveService {
  load<T>(slot: string): Promise<T | null>;
  save<T>(slot: string, data: T): Promise<void>;
}

export interface IUIManager {
  open<T>(viewId: string, data?: unknown): Promise<T>;
  close(viewId: string): void;
  closeAll(): void;
}
```

实施建议： - 先写接口和最小实现，再写业务模块。 -
资源加载、场景切换、存档均优先用 `Promise` 统一异步调用风格。 -
通过依赖注入或明确的 ServiceRegistry
获取服务，不允许各模块随意创建重复管理器。 -
接口要表达真实需求，不为"未来可能用到"设计复杂泛型和层级。

------------------------------------------------------------------------

## 8. MVP 验收标准

在开始做完整游戏前，先做一个 1 个主场景 + 2 个弹窗 + 1
个可交互玩法对象的技术验证项目。

### 必须通过

-   [ ] 启动流程可控，初始化失败能显示错误信息。
-   [ ] 可以在场景间切换并显示加载状态。
-   [ ] UIManager 能打开、关闭、去重管理弹窗。
-   [ ] AssetService 能加载 Bundle 资源，并在适当时机释放。
-   [ ] EventBus 订阅/取消订阅行为有测试。
-   [ ] 设置可保存、读取；进度存档有版本号和异常回退。
-   [ ] 音乐、音效和音量设置正常。
-   [ ] 资源路径/配置 ID 校验工具可运行。
-   [ ] 桌面鼠标与 Android 触摸均能完成核心交互。
-   [ ] Android 真机运行通过；PC 构建可运行。
-   [ ] 关键错误有日志；发布版没有开发调试入口。

### 性能与稳定性检查

-   [ ] 图鉴长列表采用分页/虚拟列表或分批生成。
-   [ ] 连续切换场景后内存不持续增长。
-   [ ] 连续打开关闭弹窗后没有重复监听或残留节点。
-   [ ] 应用切后台再恢复后，音频、计时器和存档状态正确。
-   [ ] 在目标最低配置设备上测试图片加载和 UI 帧率。

------------------------------------------------------------------------

## 9. 建议开发顺序

  ---------------------------------------------------------------------------------------
  阶段                    工作内容                             产出
  ----------------------- ------------------------------------ --------------------------
  P0 工程基线             固定 Creator                         空工程可稳定构建
                          版本、Git、代码规范、构建脚本        

  P1 启动核心             Bootstrap、日志、配置、场景服务      Boot → Main 流程

  P2 UI 与事件            UIManager、EventBus、通用弹窗        可复用 UI 模板

  P3 资源与音频           Bundle、AssetService、AudioManager   资源按需加载与释放

  P4 存档与配置           SaveService、版本迁移、配置校验      可持续迭代的数据层

  P5 平台适配             Android Adapter、桌面 Adapter、Steam 两端最小可运行版本
                          桥接验证                             

  P6 工具与验收           DebugPanel、性能监控、自动检查       可供新项目复制的模板仓库
  ---------------------------------------------------------------------------------------

建议先完成
P0--P4，再做一款小型垂直切片来验证架构。不要在核心玩法尚未验证时投入大量时间开发热更新、复杂网络层或通用编辑器工具。

------------------------------------------------------------------------

## 10. 风险清单

  --------------------------------------------------------------------------
  风险                                处理建议
  ----------------------------------- --------------------------------------
  Creator 小版本差异                  固定版本；升级前在独立分支验证

  Steam 原生桥接兼容性                最早期做技术
                                      Spike，验证打包、成就和云存档

  图片内存过高                        缩略图/原图分离、Bundle
                                      分组、分页、按需释放

  单例过多、耦合严重                  服务接口明确，Bootstrap
                                      统一组装，业务模块不互相拿节点

  事件泄漏                            生命周期绑定订阅；关闭页面时统一清理

  存档损坏或迁移失败                  版本号、备份/回退、迁移测试

  插件许可证或停止维护                逐项审查，不把未验证插件作为核心依赖

  Android/PC 行为不一致               平台 Adapter + 双端真机/实机构建验收
  --------------------------------------------------------------------------

------------------------------------------------------------------------

## 11. 最终推荐

采用 **TypeScript + Cocos Creator 3.8 LTS + 轻量服务层 + 官方 Asset
Bundle + 平台 Adapter**。

第一版只实现： - Bootstrap / ServiceRegistry - SceneService -
UIManager - AssetService - EventBus - AudioManager - ConfigService -
SaveService - PlatformService（先提供桌面与 Android 基础实现） - Logger
/ DebugPanel

把网络、热更新、支付、账号、云存档、分析 SDK
放在独立可选模块中。Steamworks
应先做独立兼容性验证，不要让其依赖污染通用核心。

这套框架的重点不是模块越多越好，而是**每个模块边界清楚、生命周期可管理、资源可追踪、平台差异可替换、能够通过小型
Demo 验证**。
