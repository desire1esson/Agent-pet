// types.ts — Hermes 对接抽象层（业务层唯一依赖，不感知具体协议）
// 目的：Hermes 内核升级时只改 jsonrpc.ts，App.vue 等业务代码零改动

export type HermesStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/** 审批请求（P0：Hermes approvals → 桌面形象确认气泡） */
export interface ApprovalRequest {
  id: string;
  command: string;
  choices?: string[];
  smartDenied?: boolean;
  allowPermanent?: boolean;
}

/** 工具调用事件（P2：零感知 agent 干活） */
export interface ToolEvent {
  name: string;
  status: "start" | "complete" | "generating";
}

export interface HermesEvents {
  /** 回复流式增量 */
  onDelta?: (text: string) => void;
  /** 回复完成 */
  onComplete?: (full: string) => void;
  /** 思维过程（可选展示） */
  onThinking?: (text: string) => void;
  /** 连接状态变化 */
  onStatus?: (s: HermesStatus) => void;
  /** 审批请求（预留） */
  onApproval?: (req: ApprovalRequest) => void;
  /** 工具调用（start/complete/generating） */
  onTool?: (ev: ToolEvent) => void;
}

/** 稳定对接接口——Hermes 协议升级不影响此契约 */
export interface HermesAdapter {
  /** 内核标识（如 hermes / claude-code / codex）——UI 显示 + 多内核扩展点 */
  readonly id: string;
  /** 内核展示名 */
  readonly name: string;
  /** 建立连接（含内核版本探测）；失败抛错 */
  connect(): Promise<void>;
  disconnect(): void;
  /** 发送提示词，回复经 onDelta/onComplete 回调 */
  submit(text: string): Promise<void>;
  /** 已探测到的 Hermes 内核版本（未连接为 null） */
  readonly version: string | null;
  readonly status: HermesStatus;
  /** 注册事件回调（可覆盖） */
  setEvents(events: HermesEvents): void;
}
