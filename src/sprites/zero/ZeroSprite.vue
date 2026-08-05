<!--
  ZeroSprite —— 零的形象组件（社区替换点！）
  接收统一 SpriteProps，渲染零的全部状态。
  社区换形象 = 新建 sprites/<your-id>/YourSprite.vue（实现相同 props）→ 注册。
  状态契约见 docs/SPRITE_CONTRACT.md
-->
<script setup lang="ts">
import { computed } from "vue";
import type { SpriteProps } from "../../composables/useSpriteRegistry";

const props = defineProps<SpriteProps>();

const cls = computed(() => [
  `state-${props.state}`,
  props.act ? `act-${props.act}` : "",
  props.dancing ? "dancing" : "",
  props.danceStep ? `seq-${props.danceStep}` : "",
]);
</script>

<template>
  <div class="zero-sprite" :class="cls">
    <!-- 审批变身：像素战士立绘（danger 形态——皮肤专属危险形象） -->
    <img
      v-if="state === 'danger'"
      class="danger-form"
      src="/zero/zero_pixel.png"
      alt="zero-danger"
      draggable="false"
    />
    <svg v-else class="zero-svg" width="190" height="210" viewBox="0 0 190 190">
      <!-- 思考气泡 -->
      <g v-if="state === 'thinking'" class="think-bubbles">
        <circle class="tb tb1" cx="30" cy="36" r="4" />
        <circle class="tb tb2" cx="38" cy="22" r="6" />
        <circle class="tb tb3" cx="50" cy="10" r="8" />
      </g>
      <!-- 工作态气泡 -->
      <g v-if="state === 'working' && toolName" class="work-bubble">
        <rect x="58" y="-6" width="74" height="26" rx="13" fill="#ffffff" stroke="#1c1c2e" stroke-width="2" />
        <text x="95" y="11" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1c1c2e">
          ⚙ {{ toolName.length > 6 ? toolName.slice(0, 6) + "…" : toolName }}
        </text>
      </g>
      <!-- 左臂 -->
      <rect class="b-arm b-arm-l" x="22" y="66" width="15" height="46" rx="7.5" fill="#2a2a3e" />
      <!-- 右臂 -->
      <rect class="b-arm b-arm-r" x="153" y="66" width="15" height="46" rx="7.5" fill="#2a2a3e" />
      <!-- 左腿 -->
      <rect class="b-leg b-leg-l" x="68" y="122" width="17" height="34" rx="8" fill="#2a2a3e" />
      <!-- 右腿 -->
      <rect class="b-leg b-leg-r" x="105" y="122" width="17" height="34" rx="8" fill="#2a2a3e" />
      <!-- 身体 -->
      <g class="b-body">
        <rect x="46" y="34" width="98" height="100" rx="30" fill="#1c1c2e" stroke="#7dffa8" stroke-width="3.5" />
        <!-- MJ 道具（跳舞时） -->
        <g v-if="dancing" class="mj-gear">
          <rect x="62" y="24" width="66" height="13" rx="4" fill="#12121e" />
          <rect x="76" y="8" width="38" height="18" rx="5" fill="#12121e" />
          <rect x="73" y="31" width="44" height="4" rx="2" fill="#7dffa8" />
          <circle cx="29.5" cy="112" r="7.5" fill="#ffffff" stroke="#1c1c2e" stroke-width="1.5" />
          <circle cx="160.5" cy="112" r="7.5" fill="#ffffff" stroke="#1c1c2e" stroke-width="1.5" />
        </g>
        <!-- 眼睛：正常 -->
        <g class="eyes-normal">
          <ellipse class="b-eye b-eye-l" cx="78" cy="72" rx="12" ry="11" fill="#eaeaea" />
          <ellipse class="b-eye b-eye-r" cx="112" cy="72" rx="12" ry="11" fill="#eaeaea" />
          <circle
            class="pupil"
            :style="{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }"
            cx="81"
            cy="70"
            r="4.2"
            fill="#12121e"
          />
          <circle
            class="pupil"
            :style="{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }"
            cx="115"
            cy="70"
            r="4.2"
            fill="#12121e"
          />
          <circle cx="84" cy="66" r="1.7" fill="#fff" />
          <circle cx="118" cy="66" r="1.7" fill="#fff" />
          <!-- 眼皮（眨眼时下盖，盖住眼白+瞳孔；平时隐藏） -->
          <rect class="lid lid-l" x="65" y="61" width="26" height="22" rx="9" fill="#1c1c2e" />
          <rect class="lid lid-r" x="99" y="61" width="26" height="22" rx="9" fill="#1c1c2e" />
        </g>
        <!-- 眼睛：思考 -->
        <g class="eyes-thinking">
          <ellipse class="b-eye b-eye-l" cx="78" cy="72" rx="11" ry="11" fill="#eaeaea" />
          <ellipse class="b-eye b-eye-r" cx="112" cy="72" rx="11" ry="11" fill="#eaeaea" />
          <circle cx="80" cy="68" r="3.8" fill="#12121e" />
          <circle cx="114" cy="68" r="3.8" fill="#12121e" />
        </g>
        <!-- 眼睛：难过/睡觉（半垂） -->
        <g class="eyes-sad">
          <ellipse class="b-eye b-eye-l" cx="78" cy="74" rx="12" ry="7" fill="#eaeaea" />
          <ellipse class="b-eye b-eye-r" cx="112" cy="74" rx="12" ry="7" fill="#eaeaea" />
          <rect x="66" y="68" width="24" height="10" fill="#1c1c2e" />
          <rect x="100" y="68" width="24" height="10" fill="#1c1c2e" />
        </g>
        <!-- 眼睛：眩晕（旋转时） -->
        <g class="eyes-dizzy">
          <path d="M68 62 l20 20 M88 62 l-20 20" stroke="#eaeaea" stroke-width="3.5" stroke-linecap="round" />
          <path d="M102 62 l20 20 M122 62 l-20 20" stroke="#eaeaea" stroke-width="3.5" stroke-linecap="round" />
        </g>
        <!-- 脸红 -->
        <ellipse class="blush" cx="66" cy="80" rx="7" ry="4" fill="#ff9ff3" opacity="0" />
        <ellipse class="blush" cx="124" cy="80" rx="7" ry="4" fill="#ff9ff3" opacity="0" />
        <!-- 嘴 -->
        <path
          class="b-mouth"
          d="M88 98 Q95 92 102 98"
          stroke="#eaeaea"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />
      </g>
    </svg>
    <!-- 睡觉 Zzz -->
    <span v-if="state === 'sleep'" class="zzz">Z<span class="zz2">Z</span><span class="zz3">Z</span></span>
    <!-- 舞蹈舞台效果 -->
    <div v-if="dancing" class="dance-fx">
      <span class="note n1">♪</span>
      <span class="note n2">♫</span>
      <span class="note n3">♪</span>
      <span class="note n4">♩</span>
      <span v-if="danceStep === 'curtain'" class="ribbon r1"></span>
      <span v-if="danceStep === 'curtain'" class="ribbon r2"></span>
      <span v-if="danceStep === 'curtain'" class="ribbon r3"></span>
      <span v-if="danceStep === 'curtain'" class="ribbon r4"></span>
      <span v-if="danceStep === 'curtain'" class="ribbon r5"></span>
      <span v-if="danceStep === 'curtain'" class="ribbon r6"></span>
      <span v-if="danceStep === 'curtain'" class="bonk-flower">🌸</span>
    </div>
    <span class="heart">💚</span>
  </div>
</template>

<style scoped>
.zero-sprite {
  position: relative;
  width: 190px;
  height: 210px;
  flex: none;
}
/* 审批变身：像素战士立绘（红色警示光） */
.danger-form {
  width: 190px;
  height: 210px;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(255, 71, 87, 0.55));
  animation: danger-pulse 1.2s ease-in-out infinite;
}
@keyframes danger-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 14px rgba(255, 71, 87, 0.45));
  }
  50% {
    filter: drop-shadow(0 0 26px rgba(255, 71, 87, 0.7));
  }
}
.zero-svg {
  display: block;
  position: relative;
  filter: drop-shadow(0 0 14px rgba(125, 255, 168, 0.22));
}
/* 空闲：呼吸 */
.state-idle .b-body {
  animation: breathe 3.2s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.035); }
}
/* 思考：浮动 + 气泡 */
.state-thinking .b-body {
  animation: think-bob 1.4s ease-in-out infinite;
}
@keyframes think-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.think-bubbles {
  animation: tb-pop 1.2s ease-in-out infinite;
}
.think-bubbles circle {
  fill: #7dffa8;
}
.tb2 { animation: tb-pop 1.2s ease-in-out 0.15s infinite; }
.tb3 { animation: tb-pop 1.2s ease-in-out 0.3s infinite; }
@keyframes tb-pop {
  0%, 100% { opacity: 0.3; transform: translateY(2px); }
  50% { opacity: 1; transform: translateY(-3px); }
}
/* 眼睛切换 */
.state-thinking .eyes-normal,
.state-sad .eyes-normal,
.state-sad .eyes-thinking,
.state-sleep .eyes-normal,
.state-sleep .eyes-thinking {
  display: none;
}
.state-thinking .eyes-thinking,
.state-sad .eyes-sad,
.state-sleep .eyes-sad {
  display: block;
}
.eyes-thinking,
.eyes-sad,
.eyes-dizzy {
  display: none;
}
/* 难过/睡觉嘴 */
.state-sad .b-mouth {
  d: path("M88 104 Q95 100 102 104");
  animation: none;
}
.state-sleep .b-mouth {
  d: path("M92 100 Q95 105 98 100");
}
.state-sleep .b-body {
  animation: sleep-breathe 4s ease-in-out infinite;
}
@keyframes sleep-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
.state-sleep .b-eye {
  animation: none;
}
/* 开心（单击） */
.state-happy .b-body {
  animation: happy-jump 0.7s ease;
}
@keyframes happy-jump {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-16px) scale(1.05); }
  60% { transform: translateY(0); }
}
.state-happy .heart {
  animation: heart-pop 1s ease;
}
.heart {
  position: absolute;
  top: 8px;
  right: 14px;
  font-size: 20px;
  opacity: 0;
  pointer-events: none;
}
@keyframes heart-pop {
  0% { opacity: 0; transform: scale(0.4) translateY(4px); }
  30% { opacity: 1; transform: scale(1.2) translateY(0); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: scale(1) translateY(-12px); }
}
/* 工作态 */
.state-working .b-body {
  animation: work-lean 0.9s ease-in-out infinite alternate;
}
@keyframes work-lean {
  from { transform: rotate(-2deg) translateY(0); }
  to { transform: rotate(2deg) translateY(-3px); }
}
.state-working .b-eye {
  /* 眼白不动——眨眼由眼皮（.lid work-lid）完成 */
}
.work-bubble {
  animation: work-pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1);
}
@keyframes work-pop {
  from { transform: scale(0.6) translateY(8px); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
/* 小动作 */
.act-yawn .eyes-normal,
.act-yawn .eyes-thinking,
.act-rub .eyes-normal,
.act-rub .eyes-thinking {
  display: none;
}
.act-yawn .eyes-sad,
.act-rub .eyes-sad {
  display: block;
}
.act-yawn .b-mouth {
  d: path("M92 100 Q95 106 98 100");
}
.act-look .pupil {
  animation: look-pupil 1.8s ease-in-out infinite;
}
@keyframes look-pupil {
  0%, 100% { transform: translate(-4px, 0); }
  50% { transform: translate(4px, 0); }
}
.act-scratch .b-arm-r {
  transform: rotate(-60deg);
  transform-origin: top center;
  animation: scratch-arm 0.5s ease-in-out 3;
}
@keyframes scratch-arm {
  0%, 100% { transform: rotate(-60deg); }
  50% { transform: rotate(-42deg); }
}
.act-scratch .b-body {
  animation: scratch-lean 0.5s ease-in-out 3;
}
@keyframes scratch-lean {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
.act-stretch .b-body {
  animation: stretch-body 2.2s ease;
}
@keyframes stretch-body {
  0%, 100% { transform: scaleY(1); }
  40% { transform: scaleY(1.07); }
}
.act-stretch .b-arm-l {
  transform: rotate(34deg);
  transform-origin: top center;
}
.act-stretch .b-arm-r {
  transform: rotate(-34deg);
  transform-origin: top center;
}
.act-rub .b-arm-r {
  transform: rotate(-70deg);
  transform-origin: top center;
  animation: rub-arm 0.4s ease-in-out 3;
}
@keyframes rub-arm {
  0%, 100% { transform: rotate(-70deg); }
  50% { transform: rotate(-58deg); }
}
/* 拖拽走路 */
.dragging .b-leg-l {
  animation: leg-swing-l 0.22s linear infinite alternate;
  transform-origin: top center;
}
.dragging .b-leg-r {
  animation: leg-swing-r 0.22s linear infinite alternate;
  transform-origin: top center;
}
@keyframes leg-swing-l {
  from { transform: rotate(-20deg); }
  to { transform: rotate(14deg); }
}
@keyframes leg-swing-r {
  from { transform: rotate(14deg); }
  to { transform: rotate(-20deg); }
}
.dragging .b-arm-l {
  animation: arm-swing-l 0.22s linear infinite alternate;
  transform-origin: top center;
}
.dragging .b-arm-r {
  animation: arm-swing-r 0.22s linear infinite alternate;
  transform-origin: top center;
}
@keyframes arm-swing-l {
  from { transform: rotate(-24deg); }
  to { transform: rotate(12deg); }
}
@keyframes arm-swing-r {
  from { transform: rotate(12deg); }
  to { transform: rotate(-24deg); }
}
/* 眨眼：眼皮从身体内滑出盖眼（非边缘长出） */
.eyes-normal .lid {
  transform: translateY(-24px); /* 平时藏在身体内（同色不可见） */
  animation: blink-lid 4.5s ease-in-out infinite;
}
@keyframes blink-lid {
  0%, 92%, 100% {
    transform: translateY(-24px);
  }
  95% {
    transform: translateY(0);
  }
}
.state-working .lid {
  transform: translateY(-24px);
  animation: work-lid 1.1s ease-in-out infinite;
}
@keyframes work-lid {
  0%, 85%, 100% {
    transform: translateY(-24px);
  }
  90% {
    transform: translateY(0);
  }
}
/* Zzz */
.zzz {
  position: absolute;
  top: -4px;
  right: 8px;
  font-size: 16px;
  font-weight: 900;
  color: #7dffa8;
  text-shadow: 2px 2px 0 #1c1c2e;
  pointer-events: none;
  animation: zzz-float 2.2s ease-in-out infinite;
}
.zzz .zz2 {
  font-size: 11px;
  animation: zzz-float 2.2s ease-in-out 0.4s infinite;
}
.zzz .zz3 {
  font-size: 7px;
  animation: zzz-float 2.2s ease-in-out 0.8s infinite;
}
@keyframes zzz-float {
  0% { opacity: 0; transform: translate(0, 6px); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(6px, -12px); }
}
/* MJ 舞蹈 */
.dancing {
  background: radial-gradient(ellipse at 50% 28%, rgba(125, 255, 168, 0.16), transparent 62%);
}
.dancing .zero-svg {
  filter: drop-shadow(0 0 22px rgba(125, 255, 168, 0.5));
}
.seq-entrance .mj-gear rect:nth-child(1) {
  animation: hat-lift 0.8s ease;
}
@keyframes hat-lift {
  0% { transform: translateY(14px) rotate(0); }
  60% { transform: translateY(-10px) rotate(-6deg); }
  100% { transform: translateY(0) rotate(0); }
}
.seq-entrance .b-body {
  animation: entrance-pop 1.3s ease;
}
@keyframes entrance-pop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}
.seq-moonwalk .zero-svg {
  animation: moonwalk 1.7s ease-in-out infinite;
}
@keyframes moonwalk {
  0%, 100% { transform: translateX(-52px); }
  50% { transform: translateX(52px); }
}
.seq-moonwalk .b-leg-l {
  animation: glide-l 0.5s linear infinite;
  transform-origin: top center;
}
.seq-moonwalk .b-leg-r {
  animation: glide-r 0.5s linear infinite;
  transform-origin: top center;
}
@keyframes glide-l {
  from { transform: rotate(16deg); }
  to { transform: rotate(-16deg); }
}
@keyframes glide-r {
  from { transform: rotate(-16deg); }
  to { transform: rotate(16deg); }
}
.seq-spin .b-body {
  animation: spin360 1.2s ease-in-out 2;
  transform-origin: center;
}
@keyframes spin360 {
  from { transform: rotateY(0); }
  to { transform: rotateY(360deg); }
}
.seq-tilt .b-body {
  animation: tilt45 2.4s ease-in-out;
  transform-origin: 50% 100%;
}
@keyframes tilt45 {
  0%, 100% { transform: rotate(0); }
  30%, 70% { transform: rotate(-42deg); }
}
.seq-curtain .b-body {
  animation: curtain-bounce 2.2s ease-in-out, bonk-shake 0.45s ease-in-out 0.5s;
}
@keyframes curtain-bounce {
  0%, 100% { transform: scaleY(1); }
  35% { transform: scaleY(0.72) translateY(10px); }
  70% { transform: scaleY(1.06) translateY(-4px); }
}
.bonk-flower {
  position: absolute;
  top: -30px;
  left: 50%;
  font-size: 26px;
  transform: translateX(-50%);
  animation: bonk-fall 0.5s ease-in 0.3s forwards;
}
@keyframes bonk-fall {
  0% { top: -30px; }
  60% { top: 58px; }
  80% { top: 42px; }
  100% { top: 46px; opacity: 0; }
}
@keyframes bonk-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px) rotate(-3deg); }
  75% { transform: translateX(6px) rotate(3deg); }
}
.seq-curtain .blush {
  animation: blush-in 1.4s ease-in-out 0.6s forwards;
}
@keyframes blush-in {
  from { opacity: 0; }
  to { opacity: 0.75; }
}
/* 舞蹈表情 */
.seq-entrance .b-mouth {
  d: path("M84 100 Q95 90 106 100");
}
.seq-moonwalk .b-mouth {
  d: path("M90 99 Q95 96 100 99");
}
.seq-spin .eyes-normal,
.seq-spin .eyes-thinking,
.seq-spin .eyes-sad {
  display: none;
}
.seq-spin .eyes-dizzy {
  display: block;
}
.seq-spin .b-mouth {
  d: path("M92 100 Q95 105 98 100");
}
.seq-tilt .b-mouth {
  d: path("M90 102 Q95 97 100 102");
}
.seq-curtain .b-mouth {
  d: path("M86 102 Q95 96 104 102");
}
/* 舞蹈手臂 */
.seq-moonwalk .b-arm-l {
  animation: mw-arm-l 0.5s linear infinite;
  transform-origin: top center;
}
.seq-moonwalk .b-arm-r {
  animation: mw-arm-r 0.5s linear infinite;
  transform-origin: top center;
}
@keyframes mw-arm-l {
  from { transform: rotate(18deg); }
  to { transform: rotate(-12deg); }
}
@keyframes mw-arm-r {
  from { transform: rotate(-12deg); }
  to { transform: rotate(18deg); }
}
.seq-spin .b-arm-l {
  transform: rotate(42deg);
  transform-origin: top center;
}
.seq-spin .b-arm-r {
  transform: rotate(-42deg);
  transform-origin: top center;
}
.seq-tilt .b-arm-r {
  transform: rotate(-78deg);
  transform-origin: top center;
}
.seq-curtain .b-arm-l {
  transform: rotate(70deg);
  transform-origin: top center;
}
.seq-curtain .b-arm-r {
  transform: rotate(-70deg);
  transform-origin: top center;
}
/* 音符/彩带 */
.dance-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.note {
  position: absolute;
  font-size: 22px;
  color: #7dffa8;
  text-shadow: 2px 2px 0 #1c1c2e;
  animation: note-float 1.8s ease-in-out infinite;
}
.n1 { left: 6%; top: 18%; }
.n2 { left: 18%; top: 4%; font-size: 16px; animation-delay: 0.4s; }
.n3 { left: 86%; top: 12%; animation-delay: 0.8s; }
.n4 { left: 76%; top: 26%; font-size: 14px; animation-delay: 1.2s; }
@keyframes note-float {
  0%, 100% { transform: translateY(0) rotate(-10deg); opacity: 0.4; }
  50% { transform: translateY(-12px) rotate(10deg); opacity: 1; }
}
.ribbon {
  position: absolute;
  top: -24px;
  width: 9px;
  height: 28px;
  border-radius: 5px;
  opacity: 0.95;
  animation: ribbon-fall 1.7s ease-in forwards;
}
.r1 { left: 8%; background: #ff4757; }
.r2 { left: 24%; background: #ffd166; animation-delay: 0.15s; }
.r3 { left: 42%; background: #7dffa8; animation-delay: 0.3s; }
.r4 { left: 60%; background: #74b9ff; animation-delay: 0.45s; }
.r5 { left: 76%; background: #ff9ff3; animation-delay: 0.6s; }
.r6 { left: 90%; background: #ffd166; animation-delay: 0.75s; }
@keyframes ribbon-fall {
  0% { transform: translateY(0) rotate(0); opacity: 0; }
  15% { opacity: 0.95; }
  100% { transform: translateY(420px) rotate(720deg); opacity: 0.9; }
}
</style>
