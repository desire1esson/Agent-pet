// index.ts — Hermes 对接层统一出口
// 业务层只从这里 import，不感知底层协议实现
export { HermesJsonRpcAdapter } from "./jsonrpc";
export type { HermesAdapter, HermesEvents, HermesStatus, ApprovalRequest } from "./types";
export { resolveConfig, isVersionAtLeast } from "./config";
