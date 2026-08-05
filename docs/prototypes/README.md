# 零 · 开发原型

零的形象与动画从这些原型迭代而来——保留在此记录开发历程，供社区参考/复用。

## 内容

| 文件 | 是什么 | 成品去向 |
|---|---|---|
| `zero_character_design*.html`（v1-v4） | 形象设计迭代（Q 版零的诞生过程） | → `src/sprites/zero/ZeroSprite.vue` |
| `zero_life_anim_v8.html` | 生命动画原型（眨眼/呼吸/小动作） | → ZeroSprite 动画 CSS |
| `zero_mj_dance_v9.html` | MJ 舞蹈彩蛋原型（五段舞步/彩带/丢花） | → 对话说"跳舞"触发 |
| `zero_morph_demo*.html`（v1-v7） | 变身动画迭代（日常态 ↔ 像素立绘） | → 审批时变身 |
| `zero_pet_prototype.html` | 早期桌面形象原型 | → 整体架构参考 |
| `zero_pixel_standalone.png` | AI 生成像素立绘（审批变身资产） | → `public/zero/zero_pixel.png` |
| `zero_assets/` | 立绘辅助资产（预览图/概念图） | 资产源 |

## 使用

原型是独立的 HTML 文件，浏览器直接打开即可预览当时的动画效果。

## 说明

- 形象与动画全部原创（架构灵感来自桌面宠物生态，代码自研）
- 原型仅供浏览参考——成品实现以 `src/` 为准（更完整、已工程化）
