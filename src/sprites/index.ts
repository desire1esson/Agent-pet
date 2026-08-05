/**
 * 皮肤自动发现 —— 社区零代码接入
 *
 * 约定：src/sprites/<id>/ 目录下任意 .vue 文件 = 一个皮肤组件
 * （组件接收 SpriteProps，详见 docs/SPRITE_CONTRACT.md）
 *
 * 社区要做新皮肤：把文件夹放进 sprites/ 即可，自动出现在设置里，
 * 不需要改任何代码。可选导出 spriteMeta.name 自定义显示名。
 */
import type { Component } from "vue";
import type { SpriteProps } from "../composables/useSpriteRegistry";

export interface SpriteModule {
  default: Component<SpriteProps>;
  spriteMeta?: { name?: string };
}

/** 自动扫描 sprites/<id>/*.vue */
const modules = import.meta.glob("./*/*.vue", { eager: true }) as Record<string, SpriteModule>;

export interface DiscoveredSprite {
  id: string;
  name: string;
  component: Component<SpriteProps>;
}

export function discoverSprites(): DiscoveredSprite[] {
  return Object.entries(modules)
    .map(([path, mod]) => {
      const id = path.split("/")[1]; // "./zero/ZeroSprite.vue" → "zero"
      const name = mod.spriteMeta?.name ?? id;
      return { id, name, component: mod.default };
    })
    .filter((s) => s.id && s.component);
}
