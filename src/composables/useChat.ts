/**
 * useChat —— agent 会话层
 * 事件 → 消息 + 广播总线（不直接改形象状态）
 * 历史记录（动态路径存储）
 */
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { HermesJsonRpcAdapter, type ApprovalRequest } from "../lib/hermes";
import { bus } from "../lib/events";
import { strings } from "../config/strings";

export interface Msg {
  role: "user" | "zero";
  text: string;
}

export function useChat(opts: {
  applyAgentEvent: (type: string, payload?: Record<string, unknown>) => void;
  settings: () => { saveHistory: boolean; historyLimit: number; transform: boolean };
  onApproval: (req: ApprovalRequest) => void;
  onEnterChat: () => void;
  onExitChat: () => void;
}) {
  const gateway = new HermesJsonRpcAdapter();
  const messages = ref<Msg[]>([]);
  const inputText = ref("");
  const chatOpen = ref(false);
  const approval = ref<ApprovalRequest | null>(null);
  const approvalBusy = ref(false);
  const gwStatus = ref("未连接");
  const kernelVersion = ref("");
  const historyPath = ref("");

  // ── 历史存储（动态路径） ──
  invoke<string>("get_history_path").then((p) => (historyPath.value = p));

  function persistHistory() {
    const s = opts.settings();
    if (!s.saveHistory) return;
    const records = messages.value.slice(-s.historyLimit).map((m) => ({
      role: m.role,
      text: m.text,
      ts: Date.now(),
    }));
    invoke("save_history", { records: { v: 1, records } });
  }

  async function restoreHistory() {
    try {
      const data = (await invoke("load_history")) as {
        v?: number;
        records?: Array<{ role: string; text: string }>;
      };
      const recs = data?.records ?? [];
      if (recs.length) {
        messages.value = recs
          .filter((r) => r.role === "user" || r.role === "zero")
          .map((r) => ({ role: r.role as "user" | "zero", text: r.text }));
      }
    } catch {
      /* 无历史 */
    }
  }

  async function clearHistory() {
    messages.value = [];
    await invoke("clear_history");
  }

  async function recallHistory() {
    if (!chatOpen.value) await openChat();
    const path = historyPath.value || (await invoke<string>("get_history_path"));
    inputText.value = strings.recallPrompt(path);
    await send();
  }

  // ── adapter 事件 → 总线 + 消息 ──
  gateway.setEvents({
    onDelta: (text) => {
      bus.emit("agent:delta", { text });
      opts.applyAgentEvent("agent:delta");
      const last = messages.value[messages.value.length - 1];
      if (last && last.role === "zero") last.text += text;
    },
    onComplete: () => {
      opts.applyAgentEvent("agent:complete");
      persistHistory();
    },
    onThinking: () => {
      bus.emit("agent:thinking");
      opts.applyAgentEvent("agent:thinking");
    },
    onStatus: (s) => {
      gwStatus.value = s;
      if (s === "connected" && gateway.version) kernelVersion.value = gateway.version;
      bus.emit("agent:status", { status: s });
      opts.applyAgentEvent("agent:status", { status: s });
    },
    onApproval: (req) => {
      opts.onApproval(req);
    },
    onTool: (ev) => {
      bus.emit("agent:tool", { status: ev.status, name: ev.name });
      opts.applyAgentEvent("agent:tool", { status: ev.status, name: ev.name });
    },
  });

  // ── 发送 ──
  async function send() {
    const text = inputText.value.trim();
    // 彩蛋：跳舞（本地执行，不发 agent）
    if (/跳.*舞|跳舞|来个舞|\bMJ\b/.test(text)) {
      inputText.value = "";
      messages.value.push({ role: "user", text });
      bus.emit("user:send", { text });
      return;
    }
    if (!text || gateway.status !== "connected") return;
    inputText.value = "";
    messages.value.push({ role: "user", text });
    messages.value.push({ role: "zero", text: "" });
    bus.emit("user:send", { text });
    persistHistory();
    await gateway.submit(text);
  }

  async function respondApproval(choice: string) {
    if (!approval.value || approvalBusy.value) return;
    approvalBusy.value = true;
    const ok = await gateway.respondApproval(choice as "once" | "session" | "always" | "deny");
    approvalBusy.value = false;
    approval.value = null;
    if (ok) {
      messages.value.push({ role: "zero", text: strings.approval.approved });
    } else {
      messages.value.push({ role: "zero", text: strings.approval.denied });
    }
    opts.applyAgentEvent("agent:complete");
  }

  function greet(): string {
    const h = new Date().getHours();
    if (h < 5) return strings.greet.night;
    if (h < 9) return strings.greet.morning;
    if (h < 12) return strings.greet.lateMorning;
    if (h < 14) return strings.greet.noon;
    if (h < 18) return strings.greet.afternoon;
    if (h < 22) return strings.greet.evening;
    return strings.greet.lateNight;
  }

  async function openChat() {
    if (chatOpen.value) return;
    // 确保 Hermes serve 在运行（缺失则自动拉起——开箱即用）
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("ensure_serve");
    } catch {
      /* 无 Tauri 环境（浏览器调试）忽略 */
    }
    chatOpen.value = true;
    opts.onEnterChat();
    setTimeout(() => {
      const el = document.querySelector(".chatlog");
      if (el) el.scrollTop = el.scrollHeight;
    }, 120);
    if (messages.value.length === 0) {
      messages.value.push({ role: "zero", text: greet() });
    }
    if (gateway.status !== "connected") {
      try {
        await gateway.connect();
        // 去重：末尾已有同文本欢迎语则不重复 push（防历史累计）
        const last = messages.value[messages.value.length - 1];
        if (!last || last.text !== strings.onConnect) {
          messages.value.push({ role: "zero", text: strings.onConnect });
        }
      } catch (err) {
        messages.value.push({ role: "zero", text: strings.connectFail((err as Error).message) });
      }
    }
  }

  async function exitChat() {
    chatOpen.value = false;
    opts.onExitChat();
  }

  return {
    gateway,
    messages,
    inputText,
    chatOpen,
    approval,
    approvalBusy,
    gwStatus,
    kernelVersion,
    historyPath,
    send,
    respondApproval,
    restoreHistory,
    clearHistory,
    recallHistory,
    persistHistory,
    openChat,
    exitChat,
  };
}
