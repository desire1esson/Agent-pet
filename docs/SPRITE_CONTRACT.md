# Sprite 契约（形象开发指南）

想给零换一个形象？你只需要写一个 Vue 组件。

## 最小皮肤（照抄 MinimalSprite 的骨架）

```vue
<script setup lang="ts">
import type { SpriteProps } from "../../composables/useSpriteRegistry";
defineProps<SpriteProps>(); // 接收统一 props
</script>

<template>
  <!-- 你的形象（SVG / HTML / 随便什么） -->
</template>
```

## SpriteProps 契约

| prop | 类型 | 含义 |
|---|---|---|
| `state` | string | 当前状态：`idle` / `thinking` / `happy` / `danger` / `working` / `sad` / `sleep` |
| `act` | string | 临时小动作：`yawn`（哈欠）/ `look`（张望）/ `scratch`（挠头）/ `stretch`（伸懒腰）/ `rub`（揉眼）/ `""` |
| `dancing` | boolean | 是否在跳舞彩蛋中 |
| `danceStep` | string | 舞步：`entrance` / `moonwalk` / `spin` / `tilt` / `curtain` / `""` |
| `pupil` | `{x, y}` | 眼睛跟随偏移（±3px） |
| `toolName` | string | 当前调用的工具名（working 态显示） |

## 状态渲染约定

| state | 应该表现 | 参考实现 |
|---|---|---|
| `idle` | 呼吸 + 偶尔眨眼 | ZeroSprite：`.state-idle .b-body` 呼吸动画 |
| `thinking` | 眼睛上飘 / 气泡 | ZeroSprite：`.state-thinking` |
| `happy` | 跳跃 + 爱心 | `.state-happy` |
| `danger` | 变身立绘 / 红色光效 | App 层显示立绘（或皮肤自己画） |
| `working` | 专注眨眼 + 工具气泡 | `.state-working` |
| `sad` | 耷拉眼 | `.state-sad` |
| `sleep` | 闭眼 + Zzz | `.state-sleep` + `.zzz` |

**不用每个状态都实现**——未实现的直接用默认样式即可。

## 注册你的皮肤

```ts
// 在 App.vue 的组装区（或你自己的入口文件）
import MySprite from "./sprites/my/MySprite.vue";
registry.register({ id: "my", name: "我的形象", component: MySprite });
```

然后在设置 → 形象 里切换。

## 提交一个皮肤

1. 建目录 `src/sprites/<your-id>/`
2. 写组件（实现 SpriteProps）
3. 在 App.vue 注册
4. PR 提交——成为内置皮肤之一
