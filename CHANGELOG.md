# Changelog

## [0.1.0] - 2026-08-05

首个公开版本——零的诞生。

### 新增
- 💬 Hermes Agent 对接（WS JSON-RPC 适配器，断线自动重连指数退避）
- ⚡ 危险操作审批（像素战士变身 + 审批卡）
- 🛠 工具调用工作态可视化
- 📝 会话历史（本地文件存储 + 一键回顾）
- 🎭 生命动画：眨眼 / 哈欠 / 挠头 / 伸懒腰 / 散步 / 贴边隐藏 / 睡觉
- 🎩 MJ 舞蹈彩蛋（月球漫步 / 45° 倾斜 / 彩带谢幕）
- 🎨 皮肤系统（SpriteProps 契约 + 自动发现）
- ⚙ 设置中心（透明度 / 置顶 / 历史 / 变身开关）
- 🖥 系统托盘（右键退出 / 左键唤起）
- 🔌 运行时配置（config.json：host/port/token，预编译用户可配置）

### 架构
- 动画引擎（数据驱动触发 DSL）
- 行为注册表（registerEffect——新行为一行注册，不碰核心）
- 事件总线（agent/用户/时间三类事件解耦）
- 适配器架构（内核可扩展）
- 运行时配置（config.json：host/port/token——预编译用户可配置）

### 工具
- zero-launcher.cmd（启动器：配 token + 拉起 Hermes serve——随安装包分发）
- 变身立绘修复（danger 形态渲染像素战士）
- 称谓统一（桌面形象）

### 文档
- SPRITE_CONTRACT / ANIMATION / ZERO_NOTE / prototypes

### 许可
- MIT
