<script setup lang="ts">
/**
 * App.vue —— 薄壳组装层
 * 只负责：把各 composable/组件接起来 + 布局模板。
 * 业务逻辑在各 composable，形象在 sprites/，配置在 config/。
 */
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { bus } from "./lib/events";
import { strings } from "./config/strings";
import "./config/theme.css";

import { useSettings } from "./composables/useSettings";
import { useWindow } from "./composables/useWindow";
import { useZeroState } from "./composables/useZeroState";
import { useAnimationEngine } from "./composables/useAnimationEngine";
import { useLifeCycle } from "./composables/useLifeCycle";
import { useChat } from "./composables/useChat";
import { useSpriteRegistry } from "./composables/useSpriteRegistry";
import ZeroSprite from "./sprites/zero/ZeroSprite.vue";
import { discoverSprites } from "./sprites";

// ═══ 模块组装 ═══
const { settings, timings } = useSettings();
const win = useWindow();
const zero = useZeroState();
const registry = useSpriteRegistry();
// 皮肤自动发现（sprites/<id>/ 目录 → 自动注册，社区零代码接入）
for (const s of discoverSprites()) registry.register(s);

const dragging = ref(false);
const hidden = ref(false);
const dancing = ref(false);
const danceStep = ref("");
const showSettings = ref(false);

// ── 舞蹈彩蛋 ──
async function triggerDance() {
  if (dancing.value) return;
  if (!chat.chatOpen.value) await chat.openChat();
  life.stopWalk();
  zero.act.value = "";
  if (zero.zeroState.value === "sleep") zero.zeroState.value = "idle";
  dancing.value = true;
  danceStep.value = "";
  await win.setSize(timings.danceW, timings.danceH);
  const ds = timings.danceSteps;
  const seq = [
    ["entrance", ds.entrance],
    ["moonwalk", ds.moonwalk],
    ["spin", ds.spin],
    ["tilt", ds.tilt],
    ["curtain", ds.curtain],
  ] as const;
  seq.forEach(([cls, t]) => setTimeout(() => (danceStep.value = cls), t));
  setTimeout(() => {
    dancing.value = false;
    danceStep.value = "";
    win.fitToContent(chat.chatOpen.value);
    chat.messages.value.push({ role: "zero", text: strings.danceDone });
    engine.resetIdleTimers();
  }, timings.danceTotal);
}

// ── 生命行为层 ──
const life = useLifeCycle({
  state: zero,
  win,
  chatOpen: () => chat.chatOpen.value,
  resetIdle: () => engine.resetIdleTimers(),
  onDance: triggerDance,
  onHappy: () => {
    if (zero.zeroState.value === "happy") return;
    zero.zeroState.value = "happy";
    setTimeout(() => {
      if (zero.zeroState.value === "happy") zero.zeroState.value = "idle";
    }, timings.happyDuration);
  },
  onPupil: (x, y) => (zero.pupil.value = { x, y }),
  isHidden: () => hidden.value,
  setHidden: (v) => (hidden.value = v),
  setDragging: (v) => (dragging.value = v),
});

// ── 动画引擎 ──
const engine = useAnimationEngine({
  state: () => zero.zeroState.value,
  chatOpen: () => chat.chatOpen.value,
  onEffect: (effect, def) => life.handleEffect(effect, def),
});

// ── 会话层 ──
const chat = useChat({
  applyAgentEvent: zero.applyAgentEvent,
  settings: () => settings.value,
  onApproval: (req) => {
    chat.approval.value = req;
    zero.zeroState.value = settings.value.transform ? "danger" : "idle";
    bus.emit("agent:approval");
    if (!chat.chatOpen.value) chat.openChat();
    chat.messages.value.push({ role: "zero", text: strings.approval.needExecute(req.command) });
  },
  onEnterChat: () => {
    win.enterChat(chatWidth.value); // 固定尺寸，不做高度自适应
  },
  onExitChat: () => {
    win.exitChat();
    engine.resetIdleTimers(); // 退出聊天 → 重置散步/睡眠计时
  },
});

// ── 聊天宽度记忆（动态；打开时最小 420 保证输入框/发送按钮显示） ──
const CHAT_W_KEY = "zero-pet-chat-w";
const savedW = Number(localStorage.getItem(CHAT_W_KEY));
const chatWidth = ref(Math.max(savedW || timings.chatWidthDefault, timings.chatWidthOpenMin));
win.appWindow.onResized(({ payload }) => {
  if (chat.chatOpen.value) {
    chatWidth.value = Math.max(payload.width, timings.chatWidthMin);
    localStorage.setItem(CHAT_W_KEY, String(chatWidth.value));
  }
});

const bubbleStyle = computed(() => ({
  // 直接内联背景（绕开 CSS 变量链，透明度 100% 生效）
  background: `rgba(18, 18, 30, ${settings.value.alpha})`,
}));

// ── 悬浮卡片自由拖动（审批卡 / 设置卡） ──
function makeCardDrag() {
  // reactive：computed 才能追踪 pos 变化 → transform 实时更新
  return reactive({
    pos: { tx: 0, ty: 0 },
    drag: { active: false, sx: 0, sy: 0, tx: 0, ty: 0 },
  });
}
const apprCard = makeCardDrag();
const setCard = makeCardDrag();

function cardDown(c: ReturnType<typeof makeCardDrag>, e: MouseEvent) {
  const t = e.target as HTMLElement;
  // 交互元素（按钮/滑块/选择框）不触发拖动
  if (t.closest("button, input, select, .approval-btns")) return;
  c.drag.active = true;
  c.drag.sx = e.screenX;
  c.drag.sy = e.screenY;
  c.drag.tx = c.pos.tx;
  c.drag.ty = c.pos.ty;
  e.stopPropagation();
}
function cardMove(c: ReturnType<typeof makeCardDrag>, e: MouseEvent) {
  if (!c.drag.active) return;
  if (e.buttons === 0) {
    c.drag.active = false;
    return;
  }
  c.pos.tx = c.drag.tx + (e.screenX - c.drag.sx);
  c.pos.ty = c.drag.ty + (e.screenY - c.drag.sy);
}
function cardUp(c: ReturnType<typeof makeCardDrag>) {
  c.drag.active = false;
}
const apprCardStyle = computed(() => ({
  transform: `translate(calc(-50% + ${apprCard.pos.tx}px), ${apprCard.pos.ty}px)`,
}));
const setCardStyle = computed(() => ({
  transform: `translate(calc(-50% + ${setCard.pos.tx}px), ${setCard.pos.ty}px)`,
}));

// ── 宽度手柄（pointer capture：手柄自己捕获指针，只改宽度，不移动面板） ──
let handleState: { sx: number; ww: number; wh: number } | null = null;

function onHandleDown(e: PointerEvent) {
  e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  win.getSize().then((sz) => {
    handleState = { sx: e.screenX, ww: sz.width, wh: sz.height };
  });
}
function onHandleMove(e: PointerEvent) {
  if (!handleState) return;
  const dx = e.screenX - handleState.sx;
  // 只改宽度（高度保持当前——不移动面板/底部）
  win.setSize(Math.max(handleState.ww + dx, timings.chatWidthMin), handleState.wh);
}
function onHandleUp(e: PointerEvent) {
  handleState = null;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* 已释放 */
  }
}

// 置顶开关实时应用
watch(
  () => settings.value.alwaysOnTop,
  (v) => win.setAlwaysOnTop(v),
  { immediate: true },
);

// 消息变化：只滚动到底（不做高度自适应）
watch(
  chat.messages,
  () => {
    const el = document.querySelector(".chatlog");
    if (el) el.scrollTop = el.scrollHeight;
  },
  { deep: true },
);

// 思考中占位气泡出现时滚动到底（气泡不是消息，不进 messages watch）
watch(zero.zeroState, (s) => {
  if (s === "thinking") {
    requestAnimationFrame(() => {
      const el = document.querySelector(".chatlog");
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
});

// ── 皮肤渲染 ──
const spriteComp = computed(() => registry.get(settings.value.sprite)?.component ?? ZeroSprite);
const spriteProps = computed(() => ({
  state: zero.zeroState.value,
  act: zero.act.value,
  dancing: dancing.value,
  danceStep: danceStep.value,
  pupil: zero.pupil.value,
  toolName: zero.toolName.value,
}));

// ── 全局鼠标（拖拽 + 眼睛跟随 + 贴边滑出） ──
function onGlobalMove(e: MouseEvent) {
  if (apprCard.drag.active) cardMove(apprCard, e);
  else if (setCard.drag.active) cardMove(setCard, e);
  else if (win.isResizing()) win.onResizeMove(e);
  else win.onMouseMove(e, (v) => (dragging.value = v));
  if (hidden.value) life.unHide();
  // 眼睛跟随
  const t = timings;
  const px = chat.chatOpen.value ? t.pupilChatX : zero.zeroState.value === "idle" && !zero.act.value ? Math.max(-t.pupilRange, Math.min(t.pupilRange, (e.clientX - window.innerWidth / 2) / t.pupilSensitivity)) : 0;
  const py = chat.chatOpen.value ? 0 : zero.zeroState.value === "idle" && !zero.act.value ? Math.max(-2, Math.min(2, (e.clientY - window.innerHeight / 2) / 40)) : 0;
  zero.pupil.value = { x: px, y: py };
}

function onGlobalUp() {
  if (apprCard.drag.active) cardUp(apprCard);
  else if (setCard.drag.active) cardUp(setCard);
  win.endResize(); // 清理 resize 状态（防松开后残留 → 误判后续拖动）
  const wasClick = win.onMouseUp((v) => (dragging.value = v));
  if (wasClick) {
    bus.emit("user:click"); // 引擎 user:click → happy 动画
    life.onInteract();
  }
}

function onMouseDown(e: MouseEvent) {
  const t = e.target as HTMLElement;
  life.onInteract();
  if (t.closest(".chatlog") || t.closest(".bubble-input")) return;
  if (chat.chatOpen.value) {
    const head = t.closest(".bubble-head");
    const spriteArea = t.closest(".sprite-wrap");
    if (!head && !spriteArea) return;
  }
  win.onMouseDown(e, true);
}

function onDblClick(e: MouseEvent) {
  // 只有双击形象（sprite-wrap）才切换 chat——卡片/气泡/空白不触发
  const t = e.target as HTMLElement;
  if (!t.closest(".sprite-wrap")) return;
  if (chat.chatOpen.value) chat.exitChat();
  else chat.openChat();
}


// ═══ 启动 ═══
onMounted(() => {
  window.addEventListener("mousemove", onGlobalMove);
  window.addEventListener("mouseup", onGlobalUp);
  window.addEventListener("pointerup", onGlobalUp);
  chat.restoreHistory();
  win.restorePosition();
  engine.resetIdleTimers();
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onGlobalMove);
  window.removeEventListener("mouseup", onGlobalUp);
  window.removeEventListener("pointerup", onGlobalUp);
  chat.persistHistory();
  chat.gateway.disconnect();
});
</script>

<template>
  <div
    id="zero"
    :class="[`state-${zero.zeroState.value}`, chat.chatOpen.value ? 'chat-mode' : 'pet-mode', dragging ? 'dragging' : '', zero.act.value ? `act-${zero.act.value}` : '', dancing ? 'dancing' : '', danceStep ? `seq-${danceStep}` : '']"
    @mousedown="onMouseDown"
    @dblclick="onDblClick"
  >
    <!-- 对话气泡（chat 模式） -->
    <div v-if="chat.chatOpen.value" class="bubble" :style="bubbleStyle">
      <div class="bubble-head" ref="win.elBubbleHead">
        <span class="dot" :class="chat.gwStatus.value"></span>
        <span class="bubble-title">
          {{ strings.title }} · {{ chat.gwStatus.value
          }}<span v-if="chat.kernelVersion.value" class="ver">{{ strings.kernel }} {{ chat.gateway.id }} v{{ chat.kernelVersion.value }}</span>
        </span>
        <span class="gear" @mousedown.stop @click="showSettings = !showSettings">⚙</span>
        <span class="close" @mousedown.stop @click="chat.exitChat()">✕</span>
      </div>
      <div class="chatlog" ref="win.elChatlog">
        <div v-for="(m, i) in chat.messages.value" :key="i" :class="`msg ${m.role}`">
          {{ m.text }}
        </div>
        <!-- 思考中占位气泡：zeropet 没有 thinking 块，用明显的"思考中"提示代替 -->
        <div v-if="zero.zeroState.value === 'thinking'" class="msg zero thinking">
          {{ strings.thinking }}<span class="dots"><i></i><i></i><i></i></span>
        </div>
      </div>
      <div class="bubble-input" ref="win.elInput">
        <div class="input-wrap">
          <input
            v-model="chat.inputText.value"
            :placeholder="strings.placeholder"
            @keydown.enter="chat.send()"
            @mousedown.stop
          />
          <div
            class="resize-handle"
            @pointerdown.stop="onHandleDown"
            @pointermove="onHandleMove"
            @pointerup="onHandleUp"
            @pointercancel="onHandleUp"
            title="拖动调整宽度"
          ></div>
        </div>
        <button class="send" @mousedown.stop @click="chat.send()">{{ strings.send }}</button>
      </div>
    </div>

    <!-- 审批卡片（悬浮独立层） -->
    <div v-if="chat.approval.value" class="approval-card float" :style="apprCardStyle" @mousedown="cardDown(apprCard, $event)" @dblclick.stop>
      <div class="approval-title">{{ strings.approval.title }}</div>
      <div class="approval-cmd">{{ chat.approval.value.command }}</div>
      <div class="approval-btns">
        <button
          v-for="c in chat.approval.value.choices ?? ['once', 'deny']"
          :key="c"
          class="appr-btn"
          :class="c === 'deny' ? 'deny' : 'ok'"
          :disabled="chat.approvalBusy.value"
          @mousedown.stop
          @click="chat.respondApproval(c)"
        >
          {{ strings.approval.choices[c] ?? c }}
        </button>
      </div>
    </div>

    <!-- 设置面板（悬浮独立层） -->
    <div v-if="showSettings" class="settings-panel float" :style="setCardStyle" @mousedown="cardDown(setCard, $event)" @dblclick.stop>
      <div class="set-group">
        <div class="set-title">{{ strings.settings.panel }}</div>
        <label class="set-row">
          <span>{{ strings.settings.alpha }}</span>
          <input type="range" v-model.number="settings.alpha" min="0.1" max="0.9" step="0.05" />
          <span class="set-val">{{ Math.round(settings.alpha * 100) }}%</span>
        </label>
        <label class="set-row">
          <span>{{ strings.settings.alwaysOnTop }}</span>
          <input type="checkbox" v-model="settings.alwaysOnTop" />
        </label>
      </div>
      <div class="set-group">
        <div class="set-title">{{ strings.settings.history }}</div>
        <label class="set-row">
          <span>{{ strings.settings.saveHistory }}</span>
          <input type="checkbox" v-model="settings.saveHistory" />
        </label>
        <label class="set-row">
          <span>{{ strings.settings.historyLimit }}</span>
          <select v-model.number="settings.historyLimit">
            <option :value="100">100 条</option>
            <option :value="200">200 条</option>
            <option :value="500">500 条</option>
          </select>
        </label>
        <div class="set-row">
          <span>{{ strings.settings.dataFile }}</span>
          <span class="set-val path" :title="chat.historyPath.value">{{ chat.historyPath.value || strings.settings.fetching }}</span>
        </div>
        <div class="set-row set-btns">
          <button class="set-btn" @click="chat.recallHistory()">🧠 {{ strings.settings.recall }}</button>
          <button class="set-btn danger" @click="chat.clearHistory()">🗑 {{ strings.settings.clear }}</button>
        </div>
      </div>
      <div class="set-group">
        <div class="set-title">{{ strings.settings.sprite }}</div>
        <label class="set-row">
          <span>{{ strings.settings.spriteSelect }}</span>
          <select v-model="settings.sprite">
            <option v-for="s in registry.sprites.value" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
        <label class="set-row">
          <span>{{ strings.settings.transform }}</span>
          <input type="checkbox" v-model="settings.transform" />
        </label>
      </div>
    </div>

    <!-- 零的形象（当前皮肤） -->
    <div class="sprite-wrap" ref="win.elZero">
      <component :is="spriteComp" v-bind="spriteProps" />
    </div>
  </div>
</template>

<style>
@import "./config/theme.css";

/* ── 全局重置（防 body 默认 margin 溢出产生滚动条） ── */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

/* ── 布局 ── */
#zero {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 8px;
  box-sizing: border-box;
  user-select: none;
  overflow: hidden;
}
.pet-mode {
  padding: 4px; /* 宠物模式：窗口贴近零尺寸 */
}
.chat-mode {
  flex-direction: row;
  align-items: flex-end;
  gap: 6px;
}
/* 零：绝对定位左下角（贴左贴底，不随内容/宽度变化） */
.chat-mode .sprite-wrap {
  position: absolute;
  left: 0;
  bottom: 0;
  top: auto;
  width: 110px;
  height: 130px;
  display: flex;
  align-items: flex-end;
  z-index: 5;
}
/* 非 scoped 全局样式：直接选子组件内部类（不能用 :deep——那只在 scoped 生效） */
.chat-mode .sprite-wrap .zero-sprite {
  width: 110px;
  height: 110px; /* 覆盖 ZeroSprite scoped 的 190×210（否则 svg 浮在容器顶部=左中） */
  transform: rotate(3deg);
}
.chat-mode .sprite-wrap .zero-svg {
  width: 110px;
  height: 110px; /* viewBox 1:1，无垂直空隙（零脚贴 wrap 底） */
}
.chat-mode .sprite-wrap .danger-form {
  width: 110px;
  height: 110px; /* 审批立绘同样压缩 */
}
.chat-mode .bubble {
  margin-left: 116px; /* 给左下角的零让位 */
  height: 100%; /* 撑满窗口高度（正常聊天框） */
}
.sprite-wrap {
  position: relative;
}

/* ── 气泡面板 ── */
.bubble {
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  flex: 1;
  min-width: 0;
  max-height: 100%;
  min-height: 0;
  position: relative;
  border: 3px solid #1c1c2e;
  border-radius: 18px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4), 4px 4px 0 rgba(0, 0, 0, 0.3);
  padding: 4px;
}
.chat-mode .bubble {
  order: 2;
  min-height: 130px;
}
.bubble-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: grab;
  font-size: 11px;
  font-weight: 800;
  color: #1c1c2e;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 12px;
  margin: 2px;
}
.bubble-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ver {
  color: var(--c-mint);
  background: var(--c-mint-soft);
  font-weight: 400;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
  white-space: nowrap;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  background: #ccc;
}
.dot.connected { background: var(--c-mint); }
.dot.connecting { background: var(--c-warn); }
.dot.reconnecting { background: var(--c-warn); animation: dot-blink 0.8s ease-in-out infinite; }
.dot.closed, .dot.error { background: var(--c-danger); }
@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.gear {
  cursor: pointer;
  font-size: 13px;
  transition: transform 0.3s;
}
.gear:hover {
  transform: rotate(90deg);
}
.close {
  margin-left: auto;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-danger);
  border: 2px solid #1c1c2e;
  border-radius: 50%;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
  transition: transform 0.1s, box-shadow 0.1s, background 0.15s;
}
.close:hover {
  background: #ff6b6b;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.25);
}
.close:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);
}

/* ── 消息区（正常滚动，撑满剩余空间） ── */
.chatlog {
  flex: 1;
  min-height: 0; /* 允许 flex 收缩（正常滚动） */
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #1c1c2e rgba(255, 255, 255, 0.3);
}
.msg {
  max-width: 88%;
  padding: 7px 11px;
  border-radius: 14px;
  border: 2.5px solid #1c1c2e;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
  font-size: 12.5px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
}
.msg.zero {
  align-self: flex-start;
  background: var(--c-bubble-other);
  border-bottom-left-radius: 4px;
}
.msg.user {
  align-self: flex-end;
  background: var(--c-bubble-me);
  border-bottom-right-radius: 4px;
}
/* 思考中占位气泡：三连点弹跳 + 弹入 */
.msg.thinking {
  display: flex;
  align-items: center;
  gap: 3px;
  animation: think-msg-in 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.msg.thinking .dots {
  display: inline-flex;
  gap: 3px;
}
.msg.thinking i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1c1c2e;
  animation: td-bounce 1.2s ease-in-out infinite;
}
.msg.thinking i:nth-child(2) {
  animation-delay: 0.15s;
}
.msg.thinking i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes td-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-4px); opacity: 1; }
}
@keyframes think-msg-in {
  from { transform: scale(0.85) translateY(4px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

/* ── 输入区 ── */
.bubble-input {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px;
}
.input-wrap {
  position: relative;
  flex: 1;
}
.input-wrap input {
  width: 100%;
  box-sizing: border-box;
  border: 2.5px solid #1c1c2e;
  border-radius: 12px;
  padding: 7px 28px 7px 10px;
  font-size: 12px;
  outline: none;
  background: #fff;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
}
.resize-handle {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 18px;
  height: 18px;
  cursor: se-resize;
  z-index: 50;
  background: linear-gradient(
    135deg,
    transparent 0 30%,
    #1c1c2e 30% 40%,
    transparent 40% 55%,
    #1c1c2e 55% 65%,
    transparent 65% 80%,
    #1c1c2e 80% 90%,
    transparent 90%
  );
  opacity: 0.5;
  transition: opacity 0.2s;
}
.resize-handle:hover {
  opacity: 1;
}
.send {
  border: 2.5px solid #1c1c2e;
  border-radius: 12px;
  background: var(--c-mint);
  color: #1c1c2e;
  font-weight: 800;
  font-size: 12px;
  padding: 7px 14px;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.1s, box-shadow 0.1s;
}
.send:hover {
  background: #9effbd;
}
.send:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
}

/* ── 审批卡片 ── */
.approval-card {
  position: absolute;
  top: 42px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: min(330px, 92%);
  background: #ffffff;
  border: 3px solid var(--c-danger);
  border-radius: 14px;
  box-shadow: 0 0 0 2px #fff, 0 0 18px rgba(255, 71, 87, 0.55);
  padding: 10px 12px;
  animation: approval-in 0.35s cubic-bezier(0.2, 1.4, 0.4, 1), approval-pulse 1.6s ease-in-out 0.4s infinite;
}
@keyframes approval-in {
  from { transform: translateX(-50%) scale(0.7) translateY(10px); opacity: 0; }
  to { transform: translateX(-50%) scale(1); opacity: 1; }
}
@keyframes approval-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #fff, 0 0 14px rgba(255, 71, 87, 0.4); }
  50% { box-shadow: 0 0 0 2px #fff, 0 0 26px rgba(255, 71, 87, 0.75); }
}
.approval-title {
  font-weight: 900;
  font-size: 12px;
  color: var(--c-danger);
  margin-bottom: 6px;
}
.approval-cmd {
  background: #f5f5fa;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  padding: 6px 8px;
  font-family: Consolas, monospace;
  font-size: 11px;
  word-break: break-all;
  margin-bottom: 8px;
  color: #333;
}
.approval-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.appr-btn {
  border: 2px solid #1c1c2e;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}
.appr-btn.ok {
  background: var(--c-mint);
  color: #1c1c2e;
}
.appr-btn.deny {
  background: #fff;
  color: var(--c-danger);
  border-color: var(--c-danger);
}
.appr-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* ── 设置面板 ── */
.settings-panel {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: min(360px, 92%);
  background: rgba(255, 255, 255, 0.97);
  border: 3px solid #1c1c2e;
  border-radius: 14px;
  box-shadow: 0 0 0 2px #fff, 4px 4px 0 rgba(0, 0, 0, 0.3);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 70%;
  overflow-y: auto;
  animation: approval-in 0.25s ease;
}
.set-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.set-title {
  font-weight: 800;
  font-size: 12px;
  color: #1c1c2e;
  border-bottom: 2px solid var(--c-mint);
  padding-bottom: 2px;
}
.set-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #1c1c2e;
  margin: 2px 0;
}
.set-row span:first-child {
  flex: none;
  min-width: 72px;
}
.set-row input[type="range"] {
  flex: 1;
  accent-color: var(--c-mint);
}
.set-row input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: var(--c-mint);
  margin-left: auto;
}
.set-row select {
  margin-left: auto;
  background: #fff;
  border: 2px solid #1c1c2e;
  border-radius: 6px;
  font-size: 11.5px;
  padding: 1px 4px;
}
.set-val {
  min-width: 40px;
  text-align: right;
  font-weight: 400;
  color: #888;
}
.set-val.path {
  font-size: 10px;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
}
.set-btns {
  gap: 6px;
  margin-top: 2px;
}
.set-btn {
  border: 2px solid #1c1c2e;
  border-radius: 8px;
  background: #fff;
  color: #1c1c2e;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}
.set-btn:hover {
  background: var(--c-mint);
}
.set-btn.danger {
  border-color: var(--c-danger);
  color: var(--c-danger);
}
.set-btn.danger:hover {
  background: var(--c-danger);
  color: #fff;
}
</style>
