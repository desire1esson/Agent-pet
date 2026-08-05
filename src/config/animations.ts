/**
 * 动画定义 —— 数据驱动的动画系统（社区编辑区）
 *
 * 每个动画 = 触发条件 + 效果 + 时长。
 * 引擎启动时校验，无效定义自动跳过（不崩）。
 *
 * trigger 字段（DSL）：
 *   event:    监听的事件（见 lib/events.ts 的 BusEventType）
 *   state:    当前状态要求（如 "idle"）
 *   afterMs:  闲置 N ms 后触发（配合 idle 计时）
 *   random:   从 random 池轮换
 *   contains: 消息包含关键词（event 为 user:send 时）
 *   chance:   触发概率 0-1
 */

import type { BusEventType } from "../lib/events";

export interface AnimationTrigger {
  event?: BusEventType;
  state?: string;
  afterMs?: number;
  random?: boolean;
  contains?: string;
  chance?: number;
}

export interface AnimationDef {
  id: string;
  trigger: AnimationTrigger;
  /** 效果：映射到形象层渲染（ZeroSprite 的 effect prop / CSS class） */
  effect: string;
  /** 时长 ms（0 = 持续到被替换） */
  duration: number;
  /** 冲突时优先级（大者胜） */
  priority?: number;
}

export const animations: AnimationDef[] = [
  // ── 生命行为 ──
  { id: "idle-blink", trigger: { state: "idle" }, effect: "blink", duration: 0 },
  { id: "yawn", trigger: { state: "idle", afterMs: 18000, random: true }, effect: "yawn", duration: 2600 },
  { id: "look", trigger: { state: "idle", afterMs: 18000, random: true }, effect: "look", duration: 1800 },
  { id: "scratch", trigger: { state: "idle", afterMs: 18000, random: true }, effect: "scratch", duration: 2600 },
  { id: "stretch", trigger: { state: "idle", afterMs: 18000, random: true }, effect: "stretch", duration: 2200 },
  { id: "walk", trigger: { state: "idle", afterMs: 45000 }, effect: "walk", duration: 0, priority: 20 },
  { id: "sleep", trigger: { state: "idle", afterMs: 90000 }, effect: "sleep", duration: 0, priority: 30 },

  // ── 用户触发 ──
  { id: "happy", trigger: { event: "user:click" }, effect: "happy", duration: 900, priority: 10 },
  { id: "drag", trigger: { event: "user:drag" }, effect: "drag", duration: 0 },

  // ── agent 联动 ──
  { id: "think", trigger: { event: "agent:delta" }, effect: "thinking", duration: 0, priority: 50 },
  { id: "work", trigger: { event: "agent:tool" }, effect: "working", duration: 0, priority: 60 },
  { id: "danger", trigger: { event: "agent:approval" }, effect: "danger", duration: 0, priority: 100 },
  { id: "sad", trigger: { event: "agent:status", state: "sad" }, effect: "sad", duration: 0, priority: 40 },

  // ── 彩蛋 ──
  { id: "dance", trigger: { event: "user:send", contains: "跳舞" }, effect: "dance", duration: 12000, priority: 200 },
];

/** 校验动画定义（无效返回错误信息） */
export function validateAnimation(def: AnimationDef): string | null {
  if (!def.id || typeof def.id !== "string") return "id 缺失";
  if (!def.trigger) return "trigger 缺失";
  if (!def.effect) return "effect 缺失";
  if (typeof def.duration !== "number" || def.duration < 0) return "duration 非法";
  if (def.trigger.event && def.trigger.afterMs) return "event 与 afterMs 不能同时存在";
  if (def.trigger.chance !== undefined && (def.trigger.chance < 0 || def.trigger.chance > 1)) {
    return "chance 需在 0-1 之间";
  }
  return null;
}
