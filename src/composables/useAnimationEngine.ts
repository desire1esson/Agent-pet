/**
 * useAnimationEngine —— 数据驱动动画引擎（纯逻辑，可单测）
 *
 * 职责：
 *  1. 校验动画配置（无效定义跳过 + 日志）
 *  2. 订阅事件总线，匹配触发条件
 *  3. 同事件多匹配 → priority 仲裁
 *  4. afterMs 闲置计时（random 动画按池随机）
 *  5. 触发时回调 onEffect(effect, def)
 *
 * 引擎不碰 DOM/窗口——只输出"效果"，由行为层处理。
 */
import { ref, onUnmounted } from "vue";
import { animations, validateAnimation, type AnimationDef } from "../config/animations";
import { bus } from "../lib/events";
import { matchDef, resolveDefs } from "../lib/animationMatch";
import type { ZeroState } from "./useZeroState";

export function useAnimationEngine(opts: {
  state: () => ZeroState;
  chatOpen: () => boolean;
  onEffect: (effect: string, def: AnimationDef) => void;
}) {
  // ── 校验配置 ──
  const valid: AnimationDef[] = [];
  let invalidCount = 0;
  for (const def of animations) {
    const err = validateAnimation(def);
    if (err) {
      invalidCount++;
      console.warn(`[engine] 动画 "${def.id}" 配置无效（${err}），已跳过`);
    } else {
      valid.push(def);
    }
  }
  const defs = ref(valid);

  // ── 触发匹配（纯函数见 lib/animationMatch.ts） ──
  const resolve = resolveDefs;
  const match = matchDef;

  function fire(def: AnimationDef) {
    if (opts.chatOpen() && def.trigger.afterMs !== undefined) return; // chat 模式不跑闲置动画
    opts.onEffect(def.effect, def);
  }

  // ── 事件订阅（同事件多匹配 → 仲裁只触发一个，防动画叠加） ──
  const eventTypes = new Set(
    defs.value.filter((d) => d.trigger.event).map((d) => d.trigger.event!),
  );
  const offs: Array<() => void> = [];
  for (const type of eventTypes) {
    offs.push(
      bus.on(type, (e) => {
        const candidates = defs.value.filter(
          (d) => d.trigger.event === type && matchDef(d, e, opts.state()),
        );
        const winner = resolveDefs(candidates);
        if (winner) fire(winner);
      }),
    );
  }

  // ── afterMs 闲置计时 ──
  // random 动画按 afterMs 分组 → 到期随机挑一个
  const randomPools = new Map<number, AnimationDef[]>();
  const timedDefs: Array<{ def: AnimationDef; delay: number }> = [];
  for (const def of defs.value) {
    if (def.trigger.afterMs === undefined) continue;
    if (def.trigger.random) {
      const list = randomPools.get(def.trigger.afterMs) ?? [];
      list.push(def);
      randomPools.set(def.trigger.afterMs, list);
    } else {
      timedDefs.push({ def, delay: def.trigger.afterMs });
    }
  }

  let idleTimers: number[] = [];

  function resetIdleTimers() {
    idleTimers.forEach(clearTimeout);
    idleTimers = [];
    if (opts.chatOpen()) return;
    // 非 random 的 afterMs 动画：各自计时
    for (const { def, delay } of timedDefs) {
      idleTimers.push(
        window.setTimeout(() => {
          if (opts.chatOpen()) return;
          if (matchDef(def, { type: "time:idle", ts: Date.now() }, opts.state())) fire(def);
        }, delay),
      );
    }
    // random 池：每个池一个计时器
    for (const [ms, pool] of randomPools) {
      idleTimers.push(
        window.setTimeout(() => {
          if (opts.chatOpen()) return;
          const pick = pool[Math.floor(Math.random() * pool.length)];
          fire(pick);
        }, ms),
      );
    }
  }

  // ── 生命周期 ──
  onUnmounted(() => {
    offs.forEach((off) => off());
    idleTimers.forEach(clearTimeout);
  });

  return { defs, match, resolve, resetIdleTimers, invalidCount };
}
