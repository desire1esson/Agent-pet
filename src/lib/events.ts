/**
 * 事件总线 —— 统一事件流（动画引擎/状态机的输入源）
 *
 * 所有系统事件（agent / 用户 / 时间）都通过这里广播，
 * 触发条件 DSL 的 event 字段就是这里的 type。
 */

export type AgentEvent =
  | "agent:delta" // 流式文本增量
  | "agent:complete" // 回复完成
  | "agent:thinking" // 思考中
  | "agent:tool" // 工具调用 start/complete/generating
  | "agent:approval" // 审批请求
  | "agent:status"; // 连接状态变化

export type UserEvent =
  | "user:click" // 单击零
  | "user:drag" // 拖动窗口
  | "user:dragEnd"
  | "user:send" // 发送消息
  | "user:enterChat"
  | "user:exitChat"
  | "user:resize"; // 手动调整窗口

export type TimeEvent = "time:idle"; // 闲置计时（引擎内部产生）

export type BusEventType = AgentEvent | UserEvent | TimeEvent;

export interface BusEvent {
  type: BusEventType;
  ts: number;
  payload?: Record<string, unknown>;
}

type Listener = (e: BusEvent) => void;

/** 轻量事件总线（单例） */
class EventBus {
  private listeners = new Map<BusEventType, Set<Listener>>();

  on(type: BusEventType, fn: Listener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }

  emit(type: BusEventType, payload?: Record<string, unknown>) {
    const e: BusEvent = { type, ts: Date.now(), payload };
    this.listeners.get(type)?.forEach((fn) => {
      try {
        fn(e);
      } catch (err) {
        console.error("[events] listener error:", type, err);
      }
    });
  }
}

export const bus = new EventBus();
