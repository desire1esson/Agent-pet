# 贡献指南

欢迎给零添砖加瓦！项目保持轻量——贡献前先看 [README](README.md) 的工程理念（不堆工具链）。

## 你可以贡献什么

### 🎨 皮肤（零代码）

1. 复制 `src/sprites/minimal/` 作为骨架
2. 实现 `SpriteProps`（见 [docs/SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md)）
3. 放进 `src/sprites/<你的皮肤名>/`——自动出现在设置里
4. 提 PR

### 🎭 动画（零代码）

在 `src/config/animations.ts` 加一条定义（触发 DSL 见 [docs/ANIMATION.md](docs/ANIMATION.md)）：
```ts
{ id: "wave-hello", trigger: { event: "user:send", contains: "你好" }, effect: "happy", duration: 900 },
```

### 🔌 新内核适配

- Hermes 类（WS JSON-RPC）：参考 `src/lib/hermes/` 实现
- 协议友好内核（stdio JSON 流）：在 `src/config/agents.ts` 注册
- 详见 README「对接其他 agent」

### 🐛 Bug 修复 / ⚙ 功能

- 先开 issue 讨论（尤其涉及架构的改动）
- 保持风格：不堆工具、配置优先、可读性优先
- 改动后跑 `npm run build` + `npm test` + `cargo check`

## 流程

1. Fork + 分支（`feat/xxx` 或 `fix/xxx`）
2. 改动 + 验证（build/test/cargo 全绿）
3. PR 描述清楚：改了什么、为什么、验证结果

## 约束

- **不引入新工具链**（ESLint/格式化器/重型依赖）——除非有强烈理由并先在 issue 讨论
- 隐私优先：不硬编码凭据，token 走环境变量/运行时配置
- 形象与动画原创（不复制其他项目的资产）
