// jsonrpc.ts — Hermes JSON-RPC over Rust WS 桥 适配器（协议细节全隔离于此层）
// 协议：newline-delimited JSON-RPC（浏览器 WebSocket → Tauri IPC → Rust WS 客户端）
// Rust 侧无 Origin → 绕过 Hermes CORS 白名单（tauri:// 页面直连会被 403）
// 方法：session.create / prompt.submit
// 事件：method:"event" + params.type（message.delta / message.complete / reasoning.delta）
// ⚠️ Hermes 内核升级时：仅修改本文件的协议常量/解析，业务层零改动

import type { HermesAdapter, HermesEvents, HermesStatus } from "./types";
import { isVersionAtLeast, resolveConfig } from "./config";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// ── 协议常量（单点维护） ──
const RPC = {
  sessionCreate: "session.create",
  promptSubmit: "prompt.submit",
} as const;

const EVT = {
  messageDelta: "message.delta",
  messageComplete: "message.complete",
  reasoningDelta: "reasoning.delta",
  sessionInfo: "session.info",
  approvalRequest: "approval.request",
  toolStart: "tool.start",
  toolComplete: "tool.complete",
  toolGenerating: "tool.generating",
} as const;

/** 审批响应选项（与 Hermes tools.approval 一致） */
export type ApprovalChoice = "once" | "session" | "always" | "deny";

/** approval.request 事件 payload */
export interface ApprovalPayload {
  command: string;
  choices?: ApprovalChoice[];
  smart_denied?: boolean;
  allow_permanent?: boolean;
}

export class HermesJsonRpcAdapter implements HermesAdapter {
  readonly id = "hermes";
  readonly name = "Hermes Agent";

  private unlistenMsg: UnlistenFn | null = null;
  private rid = 0;
  private pending = new Map<number, (v: unknown) => void>();
  private streamText = "";
  private sessionIdValue: string | null = null;
  private versionValue: string | null = null;
  private statusValue: HermesStatus = "disconnected";
  private events: HermesEvents = {};

  get version(): string | null {
    return this.versionValue;
  }
  get status(): HermesStatus {
    return this.statusValue;
  }
  get sessionId(): string | null {
    return this.sessionIdValue;
  }

  setEvents(events: HermesEvents): void {
    this.events = events;
  }

  private setStatus(s: HermesStatus) {
    this.statusValue = s;
    this.events.onStatus?.(s);
  }

  private request(method: string, params: unknown): Promise<unknown> {
    const id = ++this.rid;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      void invoke("ws_send", {
        msg: JSON.stringify({ jsonrpc: "2.0", id, method, params: params ?? {} }),
      }).catch(() => {});
    });
  }

  private handleMessage(data: string) {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const resolve = this.pending.get(msg.id)!;
      this.pending.delete(msg.id);
      resolve(msg.result);
      return;
    }
    if (msg.method === "event") {
      const { type, payload } = msg.params ?? {};
      switch (type) {
        case EVT.messageDelta:
          this.streamText += payload?.text ?? "";
          this.events.onDelta?.(payload?.text ?? "");
          break;
        case EVT.messageComplete:
          this.events.onComplete?.(this.streamText);
          this.streamText = "";
          break;
        case EVT.reasoningDelta:
          this.events.onThinking?.(payload?.text ?? "");
          break;
        case EVT.approvalRequest:
          this.events.onApproval?.({
            id: payload?.id ?? String(Date.now()),
            command: payload?.command ?? "未知命令",
            choices: payload?.choices ?? ["once", "deny"],
            smartDenied: !!payload?.smart_denied,
            allowPermanent: payload?.allow_permanent,
          });
          break;
        case EVT.toolStart:
          this.events.onTool?.({
            name: payload?.name ?? payload?.tool ?? "工具",
            status: "start",
          });
          break;
        case EVT.toolComplete:
          this.events.onTool?.({
            name: payload?.name ?? payload?.tool ?? "工具",
            status: "complete",
          });
          break;
        case EVT.toolGenerating:
          this.events.onTool?.({
            name: payload?.name ?? payload?.tool ?? "工具",
            status: "generating",
          });
          break;
      }
    }
  }

  async connect(): Promise<void> {
    // 0. 解析连接配置（运行时 config.json > 环境变量 > 默认）
    const cfg = await resolveConfig();
    // 1. 版本探测（HTTP，快速失败）
    await this.probeVersion();

    // 2. 注册事件监听（一次性：消息 / 断连状态）
    if (!this.unlistenMsg) {
      this.unlistenMsg = await listen<string>("ws:message", (e) =>
        this.handleMessage(e.payload),
      );
      await listen<string>("ws:status", () => {
        if (this.manualClose) {
          this.setStatus("disconnected");
          return;
        }
        // 异常断开 → 自动重连（指数退避 1s→2s→4s…最大 30s）
        this.scheduleReconnect();
      });
    }

    // 3. Rust WS 客户端连接（无 Origin → 绕过 CORS）
    this.setStatus("connecting");
    try {
      await invoke("ws_connect", { url: cfg.wsUrl });
      this.sessionIdValue = null; // 新连接 → 会话重建
      this.reconnectAttempts = 0;
      this.setStatus("connected");
    } catch {
      this.setStatus("error");
      throw new Error("Hermes 后端连接失败");
    }
  }

  /** 断线自动重连：指数退避 + 最多 8 次 */
  private manualClose = false;
  private reconnectAttempts = 0;
  private reconnectTimer: number | undefined;

  private scheduleReconnect() {
    if (this.manualClose || this.statusValue === "connected") return;
    if (this.reconnectAttempts >= 8) {
      this.setStatus("error");
      return;
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;
    this.setStatus("reconnecting");
    this.reconnectTimer = window.setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        this.scheduleReconnect(); // 失败继续退避
      }
    }, delay);
  }

  /** 探测内核版本（HTTP /api/status）；版本过旧给出警告但不阻断 */
  private async probeVersion(): Promise<void> {
    try {
      const cfg = await resolveConfig();
      const res = await fetch(cfg.statusUrl, {
        signal: AbortSignal.timeout(3000),
      });
      const data = (await res.json()) as { version?: string };
      this.versionValue = data.version ?? null;
      if (
        this.versionValue &&
        !isVersionAtLeast(this.versionValue, cfg.minVersion)
      ) {
        console.warn(
          `[zero-pet] Hermes 内核 ${this.versionValue} 低于最低支持 ${cfg.minVersion}，建议升级`,
        );
      }
    } catch {
      this.versionValue = null; // 探测失败不阻断连接（WS 自己会报错）
    }
  }

  disconnect(): void {
    this.manualClose = true;
    window.clearTimeout(this.reconnectTimer);
    void invoke("ws_close").catch(() => {});
    this.sessionIdValue = null;
    this.setStatus("disconnected");
  }

  async submit(text: string): Promise<void> {
    await this.ensureSession();
    this.streamText = "";
    await this.request(RPC.promptSubmit, {
      session_id: this.sessionIdValue,
      text,
    });
  }

  private async ensureSession(): Promise<void> {
    if (this.sessionIdValue) return;
    const r = (await this.request(RPC.sessionCreate, {})) as {
      session_id: string;
    };
    this.sessionIdValue = r.session_id;
  }

  /** 响应审批请求（choice: once/session/always/deny） */
  async respondApproval(choice: ApprovalChoice, all = false): Promise<boolean> {
    if (!this.sessionIdValue) return false;
    const r = (await this.request("approval.respond", {
      session_id: this.sessionIdValue,
      choice,
      all,
    })) as { resolved?: boolean };
    return !!r?.resolved;
  }
}
