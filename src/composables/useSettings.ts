/**
 * useSettings —— 设置中心（面板/会话/形象/窗口）
 * 所有用户可调参数集中管理 + localStorage 持久化
 */
import { ref, watch } from "vue";
import { timings } from "../config/timings";
import { animations } from "../config/animations";

const SET_KEY = "zero-pet-settings";

export interface Settings {
  alpha: number; // 面板背景透明度
  saveHistory: boolean;
  historyLimit: number;
  transform: boolean; // 审批变身
  alwaysOnTop: boolean;
  sprite: string; // 当前皮肤 id
}

export function useSettings() {
  const settings = ref<Settings>({
    alpha: 0.5,
    saveHistory: true,
    historyLimit: 200,
    transform: true,
    alwaysOnTop: true,
    sprite: "zero",
  });

  try {
    const saved = JSON.parse(localStorage.getItem(SET_KEY) || "{}");
    Object.assign(settings.value, saved);
  } catch {
    /* 默认值 */
  }

  watch(settings, (v) => localStorage.setItem(SET_KEY, JSON.stringify(v)), { deep: true });

  return { settings, timings, animations };
}
