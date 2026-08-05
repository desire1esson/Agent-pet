# 动画配置指南

动画系统是**数据驱动**的——所有动画都在 `src/config/animations.ts` 定义，**改配置就能加动画/改触发，不用写逻辑代码**。

## 一个动画定义

```ts
{
  id: "cat-dance",                          // 唯一 id
  trigger: {                                // 触发条件（DSL）
    event: "user:send",                     // 监听的事件
    contains: "喵",                         // 消息包含关键词
    chance: 0.5,                            // 50% 概率触发
  },
  effect: "cat-dance",                      // 效果名（你的皮肤里渲染它）
  duration: 3000,                           // 时长 ms
  priority: 50,                             // 冲突优先级（大者胜）
}
```

## 触发条件 DSL（trigger 字段）

| 字段 | 说明 | 示例 |
|---|---|---|
| `event` | 监听事件（见下方事件表） | `{ event: "user:click" }` |
| `state` | 要求当前处于某状态 | `{ state: "idle" }` |
| `afterMs` | 闲置 N ms 后触发（只能 idle 用） | `{ state: "idle", afterMs: 45000 }` |
| `random` | 加入随机池（同 afterMs 的多个随机动画轮换） | `{ state: "idle", afterMs: 18000, random: true }` |
| `contains` | 消息包含关键词（配 `event: "user:send"`） | `{ event: "user:send", contains: "跳舞" }` |
| `chance` | 触发概率 0-1 | `{ chance: 0.3 }` |

## 事件表

| 事件 | 触发时机 |
|---|---|
| `agent:delta` | agent 流式回复增量 |
| `agent:complete` | 回复完成 |
| `agent:thinking` | 思考中 |
| `agent:tool` | 工具调用（start/complete） |
| `agent:approval` | 审批请求 |
| `agent:status` | 连接状态变化 |
| `user:click` | 单击零 |
| `user:drag` | 拖动窗口 |
| `user:send` | 发送消息（payload.text = 消息内容） |
| `user:enterChat` | 打开对话 |
| `user:exitChat` | 关闭对话 |

## 效果（effect）在哪里渲染

1. **内置效果**（`yawn`/`look`/`scratch`/`stretch`/`rub`/`walk`/`sleep`/`happy`/`dance`/`drag`）——行为层已注册（散步/睡眠/舞蹈等系统行为）
2. **自定义效果**——在你的皮肤组件里根据 `props.act` 或自定义逻辑渲染（见 SPRITE_CONTRACT.md）

## 行为级效果（需要代码的高级扩展）

大部分效果是"皮肤渲染"（配置即可）；**行为级效果**（如散步是窗口移动、睡眠是状态切换）需要注册一个处理函数——**一行注册，不碰核心**：

```ts
// 1. config/animations.ts 定义（触发照常配置）
{ id: "roll", trigger: { state: "idle", afterMs: 120000 }, effect: "roll", duration: 2000 },

// 2. 代码里注册行为（新建文件 src/effects/roll.ts，或在 App.vue 组装区）
import { registerEffect } from "../composables/useLifeCycle";
registerEffect("roll", (def, ctx) => {
  ctx.act.value = "roll";                    // 设置小动作（皮肤据此渲染）
  ctx.win.moveTo(x, y);                      // 或调用窗口接口做位置动画
  // ctx 提供：act / zeroState / win / walkState / startWalk / doSleep / onHappy / onDance
  setTimeout(() => (ctx.act.value = ""), def.duration);
});

// 3.（可选）皮肤渲染该效果——ZeroSprite 里根据 props.act === "roll" 做动画
```

**内置行为已注册**：`yawn/look/scratch/stretch/rub/walk/sleep/happy/dance/drag`——注册表可覆盖（`registerEffect` 同名替换）。

## 示例：加一个"被打招呼就开心"

```ts
{ id: "wave-hello", trigger: { event: "user:send", contains: "你好" }, effect: "happy", duration: 900 },
```

## 校验与降级

引擎启动时校验所有定义：
- 无效定义 → **跳过 + 控制台警告**（不崩溃）
- 字段错误（如 event 与 afterMs 并存）→ 拒绝
- 内置默认永远兜底
