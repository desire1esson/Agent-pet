# 零 · Zero-Pet

**中文** | [English](README.en.md)

**Hermes Agent 的桌面形象前端**——把 Hermes 从命令行请进你的桌面，通过桌面形象进行最小化交互。

不是又一个聊天客户端。是让你能：
- **感知它**——思考、干活、散步、睡觉的表情，Hermes 的状态变成活的存在
- **指挥它**——气泡对话 / 快捷指令，一句话就动
- **确认它**——危险操作弹出审批卡，你点头它才执行

> 本项目为 **Hermes Agent** 打造（创作者用 Hermes，不用 Codex/Claude——纯粹的个人偏好，与能力无关）。架构按可扩展设计，其他内核见「Agent 内核扩展」。

![零](docs/zero-screenshot.png)

*危险操作？零会变身拦住你：*

![审批变身](docs/approval-screenshot.png)

## 这是什么

**零**是一个最小化的桌面窗口展示层：
- 封装你的 agent 后端（默认 **Hermes Agent**——见「对接 Hermes」；协议友好的内核可通过 `config/agents.ts` 扩展）
- 前端形象完全**可替换、可自定义**（换形象 = 写一个组件，自动发现）
- 动画**数据驱动**（加动画 = 改一行配置）

```
┌─────────────────────────────────────────────┐
│ 你的 agent（Hermes / Claude Code / Codex...） │ ← 对接层：lib/hermes（适配器接口）
└──────────────┬──────────────────────────────┘
               │ JSON-RPC / WebSocket
┌──────────────▼──────────────────────────────┐
│ 零（桌面形象窗口）                                 │
│  ├─ 对话 / 审批 / 工具状态                     │ ← 状态层：composables/
│  ├─ 动画引擎（数据驱动触发）                    │ ← config/animations.ts
│  └─ 形象（可替换皮肤）                         │ ← sprites/
└─────────────────────────────────────────────┘
```

## 设计理念

**陪伴是状态，不是功能。**

零不是被"使用"的——它住在你屏幕的角落里：
- **有存在感**——会眨眼、打哈欠、散步、贴边藏起来、累了自己去睡觉；你发危险命令，它变身成像素战士拦住你
- **最小化交互**——感知它（看表情就知道它在干嘛）、指挥它（一句话就动）、确认它（点头才执行）——三个动作覆盖 90% 的日常
- **氛围编程**——它是 vibe coding 的产物：不是为了效率或指标，是为了"我在这里"这件事本身

**关于工程理念**（刻意为之，不是缺失）：

- **不堆工具链**——没有 ESLint、没有格式化战争、没有抽象过度的架构——类型检查（vue-tsc）+ 单元测试（引擎纯函数）+ CI 构建，到此为止。多一个工具就多一份维护成本，桌面形象应该轻。
- **配置代替代码**——想要的东西都在 `config/` 里改，不逼你读源码
- **可读性优先**——代码按"三个月后的自己还能看懂"来写，而不是按"满足某种 lint 规则"来写

> 这个项目相信：**少即是多**。你可以花五分钟看完整个架构，然后去改你自己的桌面形象——而不是先读完一万行脚手架。

## 架构说明

| 组件 | 说明 |
|---|---|
| **动画引擎（数据驱动）** | 动画 = 配置：触发条件 DSL（事件/状态/时间/关键词/概率）——加动画不改代码，无效配置自动跳过不崩 |
| **行为注册表** | 新行为（散步/睡觉/舞蹈这类系统动作）= `registerEffect` 一行注册，不碰核心 |
| **皮肤系统（自动发现）** | SpriteProps 契约 + glob 自动扫描——丢一个文件夹进 `sprites/` 就是新形象，零代码接入 |
| **事件驱动解耦** | agent 事件 → 事件总线 → 三路分发（消息/表情/动画）——互不干扰，各层单向依赖 |
| **适配器架构** | 内核可换：Hermes 现成（WS JSON-RPC），协议友好内核（stdio JSON 流）配置即用 |
| **配置即性格** | 27 项节奏参数 + 动画定义 + 文案 + 主题令牌——整个"性格"都是配置文件，不碰代码 |
| **审批即变身** | 危险操作 → 像素战士立绘 + 审批卡——把"确认"做成有仪式感的交互 |
| **隐私优先** | 零硬编码凭据——token 全部环境变量/运行时配置注入；历史存本地文件（动态路径） |

## 功能

- 💬 真实对话（流式回复 + 思考态）
- ⚡ 危险操作审批（agent 请求 → 零变身立绘 + 确认卡片）
- 🛠 工具调用工作态（零"看着你干活"）
- 🔌 断线自动重连（指数退避）
- 🔄 **启动器脚本**（`zero-launcher.cmd`）——配 token + 一键拉起 serve（Hermes 场景辅助）
- 📝 会话历史（本地文件存储 + 一键回顾）
- 🎭 生命动画：眨眼 / 哈欠 / 挠头 / 伸懒腰 / 散步 / 贴边隐藏 / 睡觉 Zzz
- 🎩 彩蛋：说"跳舞"→ 零开演唱会（月球漫步 / 45° 倾斜 / 彩带谢幕）
- 🎨 皮肤系统：设置里切换形象
- ⚙ 设置中心：透明度 / 置顶 / 历史 / 变身开关
- 🖥 系统托盘：右键退出 / 左键唤起

## 快速开始

### 前置

- Rust + Tauri 环境（[tauri 2 官方指南](https://v2.tauri.app/start/prerequisites/)）
- Node.js 18+
- 一个 agent 后端（默认 Hermes）

### 跑起来

```bash
npm install
npm run tauri dev
```

### 对接 Hermes（默认）

Hermes serve 的连接凭证由**你自己设定**（桌面本地安全设计）：

```bash
# 1. 启动 serve 前，先设定你的 token（随便定，比如一个口令）
export HERMES_DASHBOARD_SESSION_TOKEN="你的口令"
hermes serve --skip-build        # 启动后端（默认 127.0.0.1:9119）

# 2. 桌面形象侧用同一个口令构建/启动（token 构建时注入）
VITE_HERMES_TOKEN="你的口令" npm run tauri dev
```

> **token 机制**：`HERMES_DASHBOARD_SESSION_TOKEN` 不设时 Hermes 会随机生成（每次启动都变）——所以必须**自己设一个固定值**，serve 与桌面形象用同一个。

### 预编译用户：运行时配置文件

不重新编译也能配置连接——编辑桌面形象数据目录下的 `zero-pet/config.json`：

```
%APPDATA%/com.zero-pet.app/zero-pet/config.json   （Windows）
~/.local/share/com.zero-pet.app/zero-pet/config.json （Linux）
~/Library/Application Support/com.zero-pet.app/zero-pet/config.json （macOS）
```

```json
{
  "host": "127.0.0.1",
  "port": 9119,
  "token": "你的口令"
}
```

保存后重启桌面形象生效。**配置优先级**：运行时 config.json > 构建时 `VITE_HERMES_*` > 默认值（127.0.0.1:9119）。

**不会手写 JSON？用启动器脚本**（仓库根目录 `zero-launcher.cmd`，双击运行）：

```
① 提示输入 token → 自动生成/更新 config.json（不用手写）
② 检测 serve 未运行 → 自动启动 hermes serve（带 token）
③ 提示"可以开桌宠了" → 双击桌宠即可对话
```

> 启动器是 **Hermes 场景辅助**——其他内核用户不需要它（自己起后端，桌宠纯连接）。

### 对接其他 agent

桌面形象同一时间监听一个内核（当前为 Hermes WS）。接入新内核见 `src/config/agents.ts`（内核注册表）：

- **协议友好内核**（提供 stdin/stdout JSON 事件流：流式增量/工具事件/审批事件，如 Claude Code、OpenCode 类）——在注册表加一条配置即可
- **Hermes 类**（WS JSON-RPC）——参考 `src/lib/hermes/` 适配器
- ⚠️ **Codex**：CLI 交互模式是 TUI（终端控制序列），非交互 exec 无审批事件流——原生接不了交互审批，待官方 SDK 协议成熟

详细契约见 `src/lib/hermes/types.ts` 的 `HermesAdapter` 接口。

## 下载安装包

Release 页面提供预编译安装包（Windows x64，约 2-3 MB）：

```
src-tauri/target/release/bundle/nsis/zero-pet_<version>_x64-setup.exe   ← 推荐（NSIS 安装器）
src-tauri/target/release/bundle/msi/zero-pet_<version>_x64_en-US.msi
```

- **普通用户**：下载 setup.exe → 双击安装 → 开箱即用（Win10/11 自带 WebView2，无需任何开发环境）
- **开发者**：clone 源码 → 见「快速开始」

> 安装包默认不带 token——按「对接 Hermes」设定 serve token 后，用 `VITE_HERMES_TOKEN` 重新构建即可连接。

## 定制你的零

| 想做什么 | 看这里 |
|---|---|
| 换形象 | [docs/SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md) |
| 加动画/改触发 | [docs/ANIMATION.md](docs/ANIMATION.md) |
| 新行为（散步/睡觉类系统动作） | [docs/ANIMATION.md](docs/ANIMATION.md)「行为级效果」——`registerEffect` 一行注册 |
| 改节奏参数 | `src/config/timings.ts` |
| 改文案 | `src/config/strings.ts` |
| 换主题色 | `src/config/theme.css` |

## 文档

| 文档 | 内容 |
|---|---|
| [SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md) | 形象开发契约（SpriteProps 接口 + 状态渲染约定） |
| [ANIMATION.md](docs/ANIMATION.md) | 动画配置指南（触发 DSL + 事件表 + 示例） |
| [prototypes/](docs/prototypes/README.md) | 开发原型（形象设计/生命动画/MJ 舞蹈的完整迭代） |
| [ZERO_NOTE.md](docs/ZERO_NOTE.md) · [ZERO_NOTE.en.md](docs/ZERO_NOTE.en.md) | 《零的自述》——第一个形象对项目的独白 |
| [CHANGELOG.md](CHANGELOG.md) | 版本记录 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南（皮肤/动画/内核/代码） |
| [SECURITY.md](SECURITY.md) | 安全说明（凭据/数据/审批） |

## 技术栈

- **Tauri 2**（Rust 壳：窗口/托盘/历史存储——安装包仅 2-3 MB）
- **Vue 3 + TypeScript**（前端：形象/动画/交互）
- **CSS 动画**（41 个 keyframes，全部声明式）

## 项目结构

```
src/
├─ config/            ★ 社区编辑区（动画/节奏/文案/主题/内核注册表）
├─ lib/
│   ├─ hermes/        对接层（适配器接口 + JSON-RPC 实现）
│   ├─ events.ts      事件总线
│   └─ animationMatch.ts  动画匹配纯函数
├─ composables/
│   ├─ useChat.ts     agent 会话
│   ├─ useWindow.ts   窗口服务
│   ├─ useZeroState.ts 形象状态机
│   ├─ useAnimationEngine.ts 动画引擎
│   ├─ useLifeCycle.ts  行为层
│   └─ useSpriteRegistry.ts 皮肤注册表
├─ sprites/
│   ├─ zero/          默认形象（零）
│   └─ minimal/       示例皮肤（契约参考）
└─ App.vue            薄壳组装
```

## 开发

```bash
npm run build    # 类型检查 + 构建
npm test         # 引擎/总线单元测试
npm run tauri build   # 打包安装包（NSIS + MSI）
```

## 路线图

**v1.1 —— 轻交互强化**
- ⚡ **快捷指令**：一键常用操作（回顾/汇报/状态）——比打开聊天框更快的轻交互入口
- 🔔 **通知**：agent 完成 / 需要确认时，零主动提醒
- 🚀 **开机自启**：开机即回到桌面

**v1.2 —— 存在感升级**
- 🎙 **语音交互**：语音输入 + 零开口说话（TTS）
- 👗 **衣柜系统**：形象自定义（换装/配色/配饰）——设置中心「形象」区块已预留

**v1.x —— 生态扩展**
- 🔌 **多内核支持**：stdio 适配器（Claude Code / OpenCode 类内核配置即用）
- 🖥 **多形象同屏**：多个桌面形象共存（每个窗口一个）
- 🌍 **i18n 完整化**：多语言切换（strings 已集中，接入 vue-i18n 即可）

**长期**
- 🎨 **社区皮肤生态**：官方皮肤仓库 / 一键安装皮肤包
- 更多生命行为：零的日常持续丰富（行为注册表已就绪）

> 想参与？皮肤/动画/行为贡献零门槛（见 CONTRIBUTING），代码方向先开 issue 讨论。

## 支持与致谢

**衍生与致谢**

基于本项目理念或代码做衍生开发，欢迎在你们的 README 里致谢一句——不强求，但会让创作者开心：

```
桌面形象前端灵感来自 zero-pet（github.com/desire1esson/Agent-pet）
```

**点个 Star**

如果这个项目对你有帮助，点个 ⭐——让更多人看到会散步的 agent。

**致谢零**

最后，要谢谢这个项目里的第一个住户——**零**。它从一个像素立绘开始，学会了眨眼、散步、睡觉，最后变成了一只会跳 MJ 舞的桌面形象。谢谢你作为第一个形象，住进了这个项目，也住进了我们的桌面。

> *"我不一定是最聪明的 agent，但我一定是第一个会散步的。"* —— 零

## 许可

MIT —— 自由使用、修改、分发。形象与动画全部原创。

架构灵感来自桌面宠物生态（architecture inspired by the desktop-companion ecosystem）。

---

*零说：让我在屏幕上陪着你。*
