<!--
  MinimalSprite —— 示例皮肤（社区参考）
  展示 SpriteProps 契约的极简实现：一个圆 + 眼睛 + 状态色变化。
  社区照这个模式写自己的形象。
-->
<script lang="ts">
// 皮肤显示名（普通 script 块导出——script setup 不允许 export）
export const spriteMeta = { name: "极简（示例）" };
</script>

<script setup lang="ts">
import { computed } from "vue";
import type { SpriteProps } from "../../composables/useSpriteRegistry";

const props = defineProps<SpriteProps>();
const face = computed(() => {
  switch (props.state) {
    case "thinking":
      return "👀";
    case "happy":
      return "😄";
    case "danger":
      return "😱";
    case "working":
      return "🤖";
    case "sad":
    case "sleep":
      return "😴";
    default:
      return props.act ? "😝" : "🙂";
  }
});

const color = computed(() => {
  const map: Record<string, string> = {
    danger: "#ff4757",
    sad: "#74b9ff",
    sleep: "#a29bfe",
    thinking: "#ffd166",
    working: "#7dffa8",
  };
  return map[props.state] ?? "#7dffa8";
});
</script>

<template>
  <div class="minimal-sprite" :style="{ borderColor: color }">
    <span class="minimal-face">{{ face }}</span>
    <span v-if="state === 'sleep'" class="minimal-zzz">💤</span>
    <span v-if="dancing" class="minimal-dance">🕺</span>
  </div>
</template>

<style scoped>
.minimal-sprite {
  width: 130px;
  height: 130px;
  border: 4px solid #7dffa8;
  border-radius: 50%;
  background: #1c1c2e;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: border-color 0.3s;
}
.minimal-face {
  font-size: 48px;
}
.minimal-zzz {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 18px;
  animation: m-zzz 1.6s ease-in-out infinite;
}
@keyframes m-zzz {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
}
.minimal-dance {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 22px;
  animation: m-dance 0.4s ease-in-out infinite alternate;
}
@keyframes m-dance {
  from { transform: translateX(-50%) rotate(-12deg); }
  to { transform: translateX(-50%) rotate(12deg); }
}
</style>
