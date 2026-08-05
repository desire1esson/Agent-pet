/**
 * useLifeCycle —— 动画行为层
 * 接收引擎的 effect → 变成实际行为（小动作/散步/贴边/睡眠/舞蹈/揉眼/开心）
 * 交互时重置引擎计时
 *
 * ★ 扩展点：行为注册表
 * 新行为 = registerEffect("名字", handler) 一行注册（不碰本文件核心逻辑）：
 *   registerEffect("roll", (def, ctx) => { ctx.act.value = "roll"; ... })
 */
import { ref } from "vue";
import type { AnimationDef } from "../config/animations";
import { timings } from "../config/timings";
import type { useWindow } from "./useWindow";
import type { useZeroState } from "./useZeroState";

/** 行为处理上下文（每实例注入——handler 通过它访问当前形象/窗口） */
export interface LifeCycleContext {
  act: ReturnType<typeof useZeroState>["act"];
  zeroState: ReturnType<typeof useZeroState>["zeroState"];
  win: ReturnType<typeof useWindow>;
  walkState: { value: "idle" | "walking" | "hidden" };
  startWalk: () => void;
  doSleep: () => void;
  onHappy: () => void;
  onDance: () => void;
}

export type EffectHandler = (def: AnimationDef, ctx: LifeCycleContext) => void;

/** ★ 行为注册表（模块级共享——社区扩展点） */
const effectHandlers = new Map<string, EffectHandler>();

export function registerEffect(name: string, handler: EffectHandler) {
  effectHandlers.set(name, handler);
}

export function hasEffect(name: string) {
  return effectHandlers.has(name);
}

/** 小动作统一处理（设置 act + 定时清除） */
function actFor(ctx: LifeCycleContext, name: string, duration: number) {
  ctx.act.value = name;
  setTimeout(() => {
    if (ctx.act.value === name) ctx.act.value = "";
  }, duration);
}

// ── 内置行为注册 ──
registerEffect("yawn", (def, ctx) => actFor(ctx, "yawn", def.duration));
registerEffect("look", (def, ctx) => actFor(ctx, "look", def.duration));
registerEffect("scratch", (def, ctx) => actFor(ctx, "scratch", def.duration));
registerEffect("stretch", (def, ctx) => actFor(ctx, "stretch", def.duration));
registerEffect("rub", (_def, ctx) => actFor(ctx, "rub", timings.rubDuration));
registerEffect("walk", (_def, ctx) => ctx.startWalk());
registerEffect("sleep", (_def, ctx) => ctx.doSleep());
registerEffect("happy", (_def, ctx) => ctx.onHappy());
registerEffect("dance", (_def, ctx) => ctx.onDance());
registerEffect("drag", () => {
  /* drag 效果由 useWindow 拖动状态驱动 */
});

export function useLifeCycle(opts: {
  state: ReturnType<typeof useZeroState>;
  win: ReturnType<typeof useWindow>;
  chatOpen: () => boolean;
  resetIdle: () => void;
  onDance: () => void;
  onHappy: () => void;
  onPupil: (x: number, y: number) => void;
  isHidden: () => boolean;
  setHidden: (v: boolean) => void;
  setDragging: (v: boolean) => void;
}) {
  const walkState = ref<"idle" | "walking" | "hidden">("idle");
  let walkDir = 1;
  let walkStep: number | undefined;
  let hideTimer: number | undefined;

  const { zeroState, act } = opts.state;
  const { win } = opts;

  // ── 散步 ──
  async function startWalk() {
    if (opts.chatOpen() || walkState.value !== "idle") return;
    walkState.value = "walking";
    opts.setDragging(true);
    act.value = "";
    // y 归位屏幕底部
    const mon = await win.getScreenSize();
    const sz = await win.getSize();
    if (mon.w > 0) {
      const pos = await win.getPos();
      const bottomY = mon.h - sz.height - 16;
      if (Math.abs(pos.y - bottomY) > 8) await win.moveTo(pos.x, bottomY);
    }
    clearInterval(walkStep);
    walkStep = window.setInterval(walkTick, timings.walkStepMs);
  }

  async function walkTick() {
    if (walkState.value !== "walking") return;
    const mon = await win.getScreenSize();
    const pos = await win.getPos();
    if (!mon.w) return;
    const hideX = mon.w - timings.edgeVisible;
    const nx = pos.x + walkDir * timings.walkStepPx;
    if (nx <= 0) {
      await win.moveTo(0, pos.y);
      walkDir = 1;
      return;
    }
    if (nx >= hideX) {
      await win.moveTo(hideX, pos.y);
      hideAtEdge();
      return;
    }
    await win.moveTo(nx, pos.y);
  }

  /** 贴边隐藏：露半身，5s 无人理 → 回角落睡觉 */
  function hideAtEdge() {
    walkState.value = "hidden";
    opts.setHidden(true);
    opts.setDragging(false);
    clearInterval(walkStep);
    hideTimer = window.setTimeout(() => {
      win.snapToCorner();
      walkState.value = "idle";
      opts.setHidden(false);
      doSleep();
    }, timings.hideAfterEdge);
  }

  function stopWalk() {
    clearInterval(walkStep);
    opts.setDragging(false);
    if (walkState.value === "walking") walkState.value = "idle";
  }

  /** 从贴边滑出回位 */
  function unHide() {
    if (walkState.value === "hidden") {
      walkState.value = "idle";
      opts.setHidden(false);
      clearTimeout(hideTimer);
      win.getPos().then((pos) => {
        win.getScreenSize().then((mon) => {
          if (mon.w) win.moveTo(mon.w - 240, pos.y);
        });
      });
    }
    stopWalk();
  }

  function doSleep() {
    if (opts.chatOpen() || zeroState.value !== "idle") return;
    act.value = "";
    stopWalk();
    zeroState.value = "sleep";
  }

  /** 行为上下文（注入注册表 handler） */
  const ctx: LifeCycleContext = {
    act,
    zeroState,
    win,
    walkState,
    startWalk,
    doSleep,
    onHappy: opts.onHappy,
    onDance: opts.onDance,
  };

  /** 引擎效果 → 行为（查注册表；未注册效果静默忽略） */
  function handleEffect(effect: string, def: AnimationDef) {
    effectHandlers.get(effect)?.(def, ctx);
  }

  /** 交互重置（点击/拖拽/对话）——顺带处理睡眠唤醒（揉眼） */
  function onInteract() {
    if (walkState.value !== "idle") unHide();
    if (zeroState.value === "sleep") {
      // 唤醒：揉揉眼
      zeroState.value = "idle";
      act.value = "rub";
      setTimeout(() => {
        if (act.value === "rub") act.value = "";
      }, timings.rubDuration);
    }
    opts.resetIdle();
  }

  return { walkState, handleEffect, startWalk, stopWalk, unHide, onInteract, doSleep };
}
