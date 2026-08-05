/**
 * 文案 —— UI 文本集中管理（社区可本地化）
 */
export const strings = {
  // 头部
  title: "零",
  kernel: "内核",
  // 状态
  status: {
    connected: "connected",
    connecting: "connecting",
    reconnecting: "reconnecting",
    disconnected: "disconnected",
    error: "error",
  },
  // 输入
  placeholder: "和零说点什么...",
  send: "发送",
  // 问候
  greet: {
    night: "夜深了，还在忙吗？",
    morning: "早上好 ☀️",
    lateMorning: "上午好，有什么需要？",
    noon: "中午好，别忘了休息一下",
    afternoon: "下午好～",
    evening: "晚上好～",
    lateNight: "这么晚了，注意休息 🌙",
  },
  // 对话
  thinking: "思考中",
  onConnect: "我在。想让我做什么？",
  connectFail: (msg: string) => `连接失败：${msg}`,
  danceDone: "表演完毕 🎩✨",
  // 审批
  approval: {
    title: "⚡ 危险操作 · 需要你确认",
    needExecute: (cmd: string) => `⚠️ 我需要执行：${cmd}`,
    approved: "已批准，继续执行。",
    denied: "好，已拒绝。我不动它。",
    choices: {
      once: "批准一次",
      session: "本次会话",
      always: "总是允许",
      deny: "拒绝",
    } as Record<string, string>,
  },
  // 设置面板
  settings: {
    panel: "🎨 面板",
    history: "💬 会话记录",
    sprite: "⚡ 形象",
    alpha: "背景透明度",
    alwaysOnTop: "窗口置顶",
    saveHistory: "保存对话",
    historyLimit: "记录上限",
    dataFile: "数据文件",
    recall: "🧠 回顾聊天",
    clear: "🗑 清空记录",
    transform: "审批时变身立绘",
    spriteSelect: "形象",
    fetching: "获取中…",
  },
  // 回顾
  recallPrompt: (path: string) => `请读取文件 ${path} 中的对话记录（JSON），回顾我们最近聊过的内容。`,
};
