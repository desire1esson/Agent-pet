/**
 * useZeroState —— 形象状态机
 * agent 事件 → 状态 的映射集中在这里（社区改这一处即可定制表情反应）
 */
import { ref, watch } from "vue";

export type ZeroState = "idle" | "thinking" | "happy" | "danger" | "working" | "sad" | "sleep";

export function useZeroState() {
  const zeroState = ref<ZeroState>("idle");
  const act = ref(""); // 小动作/临时效果（yawn/look/scratch/stretch/rub）
  const toolName = ref(""); // 工作态工具名
  const pupil = ref({ x: 0, y: 0 }); // 眼睛跟随

  /** 事件 → 状态 映射（单点） */
  function applyAgentEvent(type: string, payload?: Record<string, unknown>) {
    switch (type) {
      case "agent:delta":
        zeroState.value = "thinking";
        break;
      case "agent:complete":
        if (zeroState.value !== "danger") zeroState.value = "idle";
        break;
      case "agent:tool":
        if (payload?.status === "start" || payload?.status === "generating") {
          toolName.value = String(payload.name ?? "工具");
          zeroState.value = "working";
        } else if (payload?.status === "complete") {
          toolName.value = "";
          zeroState.value = "idle";
        }
        break;
      case "agent:approval":
        zeroState.value = "danger";
        break;
      case "agent:status":
        if (
          payload?.status === "reconnecting" ||
          payload?.status === "error" ||
          payload?.status === "disconnected"
        ) {
          zeroState.value = "sad";
        } else if (payload?.status === "connected" && zeroState.value === "sad") {
          zeroState.value = "idle";
        }
        break;
    }
  }

  // 状态离开 idle → 小动作立即让位（防鬼脸叠加）
  watch(zeroState, (s) => {
    if (s !== "idle") act.value = "";
  });

  return { zeroState, act, toolName, pupil, applyAgentEvent };
}
