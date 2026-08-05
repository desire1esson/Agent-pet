/**
 * 动画匹配纯函数（无副作用，可单测）
 */
import type { AnimationDef } from "../config/animations";
import type { BusEvent } from "./events";

/** 判断事件是否匹配触发条件 */
export function matchDef(def: AnimationDef, e: BusEvent, currentState: string): boolean {
  const t = def.trigger;
  if (t.event && t.event !== e.type) return false;
  if (t.state && currentState !== t.state) return false;
  if (t.contains) {
    const text = String(e.payload?.text ?? "");
    if (!text.includes(t.contains)) return false;
  }
  if (t.chance !== undefined && Math.random() > t.chance) return false;
  return true;
}

/** 同事件多匹配 → priority 仲裁（大者胜） */
export function resolveDefs(candidates: AnimationDef[]): AnimationDef | null {
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => ((b.priority ?? 0) > (a.priority ?? 0) ? b : a));
}
