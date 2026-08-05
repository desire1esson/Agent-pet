/**
 * useSpriteRegistry —— 皮肤注册表
 * 社区皮肤 = 一个组件（接收统一的 sprite props），注册后可在设置里切换
 */
import { ref } from "vue";

export interface SpriteProps {
  state: string; // 零的状态（idle/thinking/happy/danger/working/sad/sleep）
  act: string; // 小动作效果（yawn/look/scratch/stretch/rub/""）
  dancing: boolean;
  danceStep: string; // 舞蹈步骤（entrance/moonwalk/spin/tilt/curtain/""）
  pupil: { x: number; y: number };
  toolName: string;
}

export interface SpriteDef {
  id: string;
  name: string;
  component: unknown; // Vue 组件（接受 SpriteProps）
}

export function useSpriteRegistry() {
  const sprites = ref<SpriteDef[]>([]);

  function register(def: SpriteDef) {
    if (!sprites.value.some((s) => s.id === def.id)) sprites.value.push(def);
  }

  function get(id: string): SpriteDef | undefined {
    return sprites.value.find((s) => s.id === id);
  }

  return { sprites, register, get };
}
