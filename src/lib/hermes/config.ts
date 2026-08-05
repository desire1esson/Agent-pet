// config.ts — 对接配置集中管理
// 原则：不硬编码 URL/token，环境变量可覆盖；内核升级时只需改这里的默认值

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 9119;
// 不硬编码 token——只从环境变量 VITE_HERMES_TOKEN 读取（发布安全）

export interface HermesConfig {
  /** 内核 WS 端点 */
  wsUrl: string;
  /** 版本探测端点（HTTP） */
  statusUrl: string;
  /** 连接超时（ms） */
  connectTimeout: number;
  /** 支持的最低内核版本（0 表示不校验） */
  minVersion: string;
}

/**
 * 运行时配置（预编译用户编辑 app_data_dir/zero-pet/config.json）
 * 优先级：运行时配置 > 构建环境变量（VITE_HERMES_*）> 默认值
 */
export interface RuntimeConfig {
  host?: string;
  port?: number;
  token?: string;
}

let runtimeCache: RuntimeConfig | null = null;
let runtimeLoaded = false;

async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeLoaded) return runtimeCache ?? {};
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    runtimeCache = await invoke<RuntimeConfig>("load_runtime_config");
    runtimeLoaded = true; // 只在成功时缓存——失败不缓存，下次连接重试
  } catch {
    // IPC 未就绪/失败 → 不缓存，下次重连再试
  }
  return runtimeCache ?? {};
}

/** 解析最终连接配置（连接前调用，异步读运行时配置） */
export async function resolveConfig(): Promise<HermesConfig> {
  const rt = await loadRuntimeConfig();
  const host = rt.host || import.meta.env.VITE_HERMES_HOST || DEFAULT_HOST;
  const port = rt.port || Number(import.meta.env.VITE_HERMES_PORT) || DEFAULT_PORT;
  const token = rt.token || import.meta.env.VITE_HERMES_TOKEN || "";

  return {
    // WS 直连地址（Rust WS 客户端经 Tauri IPC 连接——Rust 无 Origin → 绕过 CORS）
    // token 在 URL 透传给 serve（serve 认证用 ?token=）
    wsUrl: token
      ? `ws://${host}:${port}/api/ws?token=${encodeURIComponent(token)}`
      : `ws://${host}:${port}/api/ws`,
    statusUrl: `http://${host}:${port}/api/status`,
    connectTimeout: 5000,
    minVersion: "0.18", // 低于此版本提示升级（协议不稳定期）
  };
}

/** 简易版本比较：a >= b ? true : false（"0.18.2" 形式） */
export function isVersionAtLeast(a: string, b: string): boolean {
  const pa = a.split(".").map((n) => parseInt(n) || 0);
  const pb = b.split(".").map((n) => parseInt(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va > vb;
  }
  return true;
}
