# 零 · Zero-Pet

**中文** | [English](README.en.md)

**Hermes Agent 的桌面形象前端**——把 Hermes 从命令行请进你的桌面，通过桌面形象进行最小化交互。

不是又一个聊天客户端。是让你能：
- **感知它**——思考、干活、散步、睡觉的表情，Hermes 的状态变成活的存在
- **指挥它**——气泡对话 / 快捷指令，一句话就动
- **确认它**——危险操作弹出审批卡，你点头它才执行

> 本项目为 **Hermes Agent** 打造（创作者用 Hermes，不用 Codex/Claude——纯粹的个人偏好，与能力无关）。架构按可扩展设计，其他内核见「对接其他内核」。
>
> 🪟 **面向 Windows 桌面**（Win10/11，x64）——使用系统 WebView2，安装包仅 2-3 MB。

![零](docs/zero-screenshot.png)

*危险操作？零会变身拦住你：*

![审批变身](docs/approval-screenshot.png)

## 这是什么

**零**是一个最小化的桌面窗口展示层：
- 封装你的 agent 后端（**Hermes Agent**，当前唯一内核）
- 前端形象完全**可替换、可自定义**（换形象 = 写一个组件，自动发现）
- 动画**数据驱动**（加动画 = 改一行配置）

## 功能

- 💬 真实对话：流式回复 + **思考中标记**（聊天区占位气泡 + 形象头顶漫画标签）
- ⚡ 危险操作审批：agent 请求 → 零变身立绘 + 确认卡片
- 🛠 工具调用工作态：零"看着你干活"
- 🔌 断线自动重连（指数退避）
- 📝 会话历史：本地文件存储 + 一键回顾
- 🎭 生命动画：眨眼 / 哈欠 / 挠头 / 伸懒腰 / 散步 / 贴边隐藏 / 睡觉
- 🎩 彩蛋：说「跳舞」→ 零开演唱会
- 🎨 皮肤系统：设置里切换形象
- ⚙ 设置中心：透明度 / 置顶 / 历史 / 变身开关
- 🖥 系统托盘：右键菜单 / 左键唤起

---

## 用户指南

*预编译用户从这里开始——不用任何开发环境。*

### 1. 安装

Release 页面下载 `zero-pet_<version>_x64-setup.exe`（NSIS 安装器，约 2-3 MB）→ 双击安装。Win10/11 自带 WebView2，无需其他依赖。

> 开发者也可以自己构建安装包，见「开发者指南」。

### 2. 连接 Hermes（密钥设置）

**为什么必须设密钥**：Hermes serve 用 `HERMES_DASHBOARD_SESSION_TOKEN` 做认证。不设的话 Hermes 每次启动随机生成一个新值——桌宠永远对不上。所以**必须自己设一个固定值**。

密钥共存在三处，必须一致：

| 位置 | 说明 |
|---|---|
| 系统环境变量 `HERMES_DASHBOARD_SESSION_TOKEN` | serve 启动时自动读取 |
| 桌宠配置 `config.json` 的 `token` | 桌宠连接时使用 |
| serve 进程启动时的环境 | 由启动器保证与上面一致 |

**① 设密钥（CMD，一次性）**

```cmd
setx HERMES_DASHBOARD_SESSION_TOKEN 你的密钥
```

> `setx` 会把密钥永久写入系统环境变量。密钥随便定（一串口令即可），但设了就别再改——改了要按第 4 步同步。

**② 双击启动器**（`zero-launcher.cmd`——安装目录下）

启动器自动完成三步：

```
[1] 检查密钥   ← 读系统环境变量；未检测到会提示你先去 CMD 执行 setx
[2] 写配置     ← 生成/校验 config.json（密钥不一致会提示你手动修改）
[3] 拉起后端   ← serve 未运行则后台自动启动；已在运行则跳过（防重复）
```

**③ 双击桌宠**（`zero-pet.exe`）→ 对话

**④ 换密钥**（只有改了 setx 才需要）：

```
setx 新值 → 删掉 config.json（或手动改 token）→ 重跑启动器 → 重开桌宠
```

**启动器提示处理**：

| 提示 | 处理 |
|---|---|
| `未检测到密钥` | CMD 执行 `setx HERMES_DASHBOARD_SESSION_TOKEN 你的密钥` → 重跑 |
| `密钥不一致` | 打开提示的 config.json，把 token 改成和 setx 一致 → 重跑 |
| `后端已在运行` | 正常——直接开桌宠 |

> 启动器是 **Hermes 场景辅助**——其他内核用户不需要它（自己起后端，桌宠纯连接）。

### 3. 手动配置（不用启动器）

不重新编译也能配置连接——编辑桌宠数据目录下的 `zero-pet/config.json`：

```
%APPDATA%/com.zero-pet.app/zero-pet/config.json   （Windows）
```

```json
{
  "host": "127.0.0.1",
  "port": 9119,
  "token": "你的密钥"
}
```

保存后重启桌宠生效。**配置优先级**：`config.json` > 构建时 `VITE_HERMES_*` > 默认值（127.0.0.1:9119）。

> 不用启动器时，serve 需要你自己启动——确保启动 serve 的进程里带着同一个 `HERMES_DASHBOARD_SESSION_TOKEN`（`export` / `setx` 均可）。

### 4. 日常使用

**与零互动**

| 操作 | 效果 |
|---|---|
| 单击零 | 零开心回应 |
| 双击零 | 打开 / 关闭聊天窗口 |
| 拖动零 | 移动位置；拖到屏幕边缘自动贴边藏起来——鼠标再动一下，它滑出来 |
| 输入「跳舞」 | MJ 舞蹈彩蛋 |
| 托盘左键 | 唤起零（窗口隐藏时） |
| 托盘菜单 | 显示零 / 退出 |

**聊天窗口**

- 头部：连接状态点 · 标题 · ⚙ 设置 · ✕ 关闭
- 底部输入框发送消息；输入框右下角手柄可拖动调整聊天宽度
- 零思考时：聊天区出现「思考中」占位气泡，形象头顶亮起漫画标签

**审批（危险操作）**

agent 请求危险操作时，零变身像素战士并弹出审批卡——**批准一次 / 本次会话 / 总是允许 / 拒绝**，你点头它才执行。

**设置（⚙）**

- 背景透明度 / 窗口置顶
- 会话历史：保存开关 / 记录上限 / 回顾聊天 / 清空记录
- 形象：切换皮肤 / 审批时变身立绘

**生命行为（自动）**

零会在你离开时自己生活：眨眼 / 打哈欠 / 挠头 / 伸懒腰；久了会散步，走到屏幕边缘贴边藏起来；夜深了会自己睡觉。

### 5. 已知问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 桌宠显示「连接失败」 | serve 未运行 或 token 不一致 | 双击启动器（自动检查密钥 → 写配置 → 拉起 serve） |
| 连不上且 serve 日志有 403/401 | 三方密钥不一致 | setx 一次 → 之后永远用启动器起 serve；不要手动/命令行起 serve |
| 手动起 serve 后连不上 | 手动进程继承了污染的环境变量，或重复绑端口 | 杀干净所有 python serve 进程 → 用启动器重起 |
| 卸载重装后 config.json 不见了 | 卸载清理用户数据目录 | 重跑启动器（自动重新生成） |
| 密钥改了但桌宠还连旧的 | config.json 没更新 | 改 setx 后手动同步 config.json（或删掉重跑启动器） |
| 后台有 hermes serve 进程 | serve 是长驻服务（正常） | **不要杀**——杀了桌宠断连；需要重启时用启动器 |
| Hermes GUI 和桌宠同时开 | GUI 的 serve 用随机端口，桌宠用 9119——无冲突 | 可以共存 |

---

## 开发者指南

### 快速开始

前置：Rust + Tauri 环境（[tauri 2 官方指南](https://v2.tauri.app/start/prerequisites/)）、Node.js 18+、一个 agent 后端（默认 Hermes）。

```bash
npm install
npm run tauri dev        # 开发模式
npm run build            # 类型检查 + 前端构建
npm test                 # 引擎/总线单元测试
npm run tauri build      # 打包安装包（NSIS + MSI）
```

开发时对接 Hermes（与用户方式等价，构建时注入密钥）：

```bash
export HERMES_DASHBOARD_SESSION_TOKEN="你的口令"
hermes serve --skip-build                      # 启动后端（默认 127.0.0.1:9119）
VITE_HERMES_TOKEN="你的口令" npm run tauri dev  # 桌面形象侧
```

### 架构

```
┌─────────────────────────────────────────────┐
│ 你的 agent（Hermes——当前唯一内核）    │ ← 对接层：lib/hermes（适配器接口）
└──────────────┬──────────────────────────────┘
               │ WebSocket（Rust 客户端直连，无 Origin）
┌──────────────▼──────────────────────────────┐
│ Rust 壳（src-tauri/src/lib.rs）              │ ← WS 桥：connect/send/close（Tauri IPC）
└──────────────┬──────────────────────────────┘
               │ Tauri IPC（invoke / event）
┌──────────────▼──────────────────────────────┐
│ 零（桌面形象窗口）                                 │
│  ├─ 对话 / 审批 / 工具状态                     │ ← 状态层：composables/
│  ├─ 动画引擎（数据驱动触发）                    │ ← config/animations.ts
│  └─ 形象（可替换皮肤）                         │ ← sprites/
└─────────────────────────────────────────────┘
```

| 组件 | 说明 |
|---|---|
| **动画引擎（数据驱动）** | 动画 = 配置：触发条件 DSL（事件/状态/时间/关键词/概率）——加动画不改代码 |
| **行为注册表** | 新行为（散步/睡觉/舞蹈）= `registerEffect` 一行注册，不碰核心 |
| **皮肤系统（自动发现）** | SpriteProps 契约 + 自动扫描——丢一个文件夹进 `sprites/` 就是新形象 |
| **事件驱动解耦** | agent 事件 → 事件总线 → 三路分发（消息/表情/动画），各层单向依赖 |
| **Rust WS 桥（无 Origin）** | 前端经 Tauri IPC 让 Rust 直连 Hermes WS——客户端不带 Origin，天然绕开浏览器 CORS 白名单，无需本地代理 |
| **配置即性格** | 节奏参数 + 动画定义 + 文案 + 主题令牌——整个"性格"都是配置文件 |
| **隐私优先** | 零硬编码凭据——token 全部环境变量/运行时配置注入；历史存本地文件 |

### 项目结构

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
src-tauri/
└─ src/lib.rs         Rust 壳：窗口/托盘/WS 桥（ws_connect/ws_send/ws_close）
```

**技术栈**：Tauri 2（Rust 壳：窗口/托盘/历史存储/WS 桥）· Vue 3 + TypeScript · CSS 动画（45 个 keyframes，全部声明式）

### 定制你的零

| 想做什么 | 看这里 |
|---|---|
| 换形象 | [docs/SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md) |
| 加动画/改触发 | [docs/ANIMATION.md](docs/ANIMATION.md) |
| 新行为（散步/睡觉类系统动作） | [docs/ANIMATION.md](docs/ANIMATION.md)「行为级效果」 |
| 改节奏参数 | `src/config/timings.ts` |
| 改文案 | `src/config/strings.ts` |
| 换主题色 | `src/config/theme.css` |

### 对接其他内核

桌面形象当前内置 **Hermes** 一个内核（WS JSON-RPC），业务层通过 `HermesAdapter` 接口与协议实现解耦（见 `src/lib/hermes/`）。接入新内核需要两步：

1. **写适配器**——实现 `HermesAdapter` 接口（流式增量 / 工具事件 / 审批事件），参考 `src/lib/hermes/jsonrpc.ts`
2. **换连接**——`src/composables/useChat.ts` 中实例化新适配器

`src/config/agents.ts` 有内核注册表的**规划声明**（协议/审批模式/启动命令），但当前版本尚未实现注册表消费与 stdio 进程管理——多内核切换是路线图中的方向，现阶段换内核 = 改代码。

- **协议友好内核**（提供 stdin/stdout JSON 事件流，如 Claude Code、OpenCode 类）——理论上适配器可行，stdio 进程管理待实现
- ⚠️ **Codex**：CLI 交互模式是 TUI（终端控制序列），非交互 exec 无审批事件流——原生接不了交互审批，待官方 SDK 协议成熟

详细契约见 `src/lib/hermes/types.ts` 的 `HermesAdapter` 接口。

---

## 设计理念

**陪伴是状态，不是功能。**

零不是被"使用"的——它住在你屏幕的角落里：感知它（看表情就知道它在干嘛）、指挥它（一句话就动）、确认它（点头才执行）——三个动作覆盖 90% 的日常。它是 vibe coding 的产物：不是为了效率或指标，是为了"我在这里"这件事本身。

**关于工程理念**（刻意为之，不是缺失）：

- **不堆工具链**——没有 ESLint、没有格式化战争——类型检查（vue-tsc）+ 单元测试 + CI 构建，到此为止。桌面形象应该轻。
- **配置代替代码**——想要的东西都在 `config/` 里改，不逼你读源码
- **可读性优先**——代码按"三个月后的自己还能看懂"来写

> 这个项目相信：**少即是多**。你可以花五分钟看完整个架构，然后去改你自己的桌面形象——而不是先读完一万行脚手架。

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

## 路线图

**v1.1 —— 轻交互强化**：快捷指令 / 通知（agent 完成、需要确认时零主动提醒）/ 开机自启

**v1.2 —— 存在感升级**：语音交互（语音输入 + TTS）/ 衣柜系统（换装/配色/配饰）

**v1.x —— 生态扩展**
- 🔌 **多内核支持（热插拔）**：当前**未实现**——内核硬编码（`useChat.ts` 直接实例化 Hermes 适配器，`config/agents.ts` 注册表仅为声明）。规划：适配器工厂 + 运行时切换 + stdio 适配器（Claude Code / OpenCode 类）
- 🖥 **多形象同屏**：多个桌面形象共存（每个窗口一个）
- 🌍 **i18n 完整化**：多语言切换（strings 已集中，接入 vue-i18n 即可）

**长期**：社区皮肤生态 / 更多生命行为

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
