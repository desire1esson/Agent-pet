/**
 * Agent 内核注册表 —— 扩展点（社区配置区）
 *
 * 桌面形象同一时间监听一个内核。当前内置 Hermes（WS JSON-RPC）。
 *
 * 接入新内核的条件（协议友好型）：
 *   - 提供 stdin/stdout JSON 事件流（含流式增量 / 工具事件 / 审批事件）
 *   - 或提供 WS/HTTP 事件端点（如 Hermes）
 * 满足后在此表加一条配置即可，无需改业务代码。
 *
 * ⚠️ 已知限制：
 *   - Codex CLI 的交互模式是 TUI（终端控制序列，非 JSON 流），
 *     非交互 exec 无审批事件流——原生接不了交互审批，需待官方 SDK 协议。
 *   - Claude Code / OpenCode 类（stdio JSON 事件流）可直接接入。
 */
export interface AgentProfile {
  id: string;
  name: string;
  protocol: "ws-jsonrpc" | "stdio-json" | "http";
  /** 启动命令（stdio 协议内核用；ws/http 内核可为空） */
  command?: string;
  /** 审批模式：event=桌面形象审批卡 / interactive=透传终端 / none=无 */
  approval: "event" | "interactive" | "none";
  streaming: boolean;
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  hermes: {
    id: "hermes",
    name: "Hermes",
    protocol: "ws-jsonrpc",
    approval: "event",
    streaming: true,
  },
  // 示例（协议友好内核，启动命令按实际填写）：
  // "claude-code": {
  //   id: "claude-code",
  //   name: "Claude Code",
  //   protocol: "stdio-json",
  //   command: "claude --output-format stream-json --input-format stream-json",
  //   approval: "event",
  //   streaming: true,
  // },
};
