/**
 * useWindow —— 窗口服务层
 * 拖拽 / resize / 高度贴合 / clamp / 位置记忆
 * 动画层通过 moveTo 等接口移动窗口，不直接操作
 */
import { ref } from "vue";
import {
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
  LogicalSize,
  currentMonitor,
} from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { timings } from "../config/timings";

const POS_KEY = "zero-pet-pos";

export type ResizeDir =
  | "North" | "South" | "West" | "East"
  | "NorthWest" | "NorthEast" | "SouthWest" | "SouthEast";

export function useWindow() {
  const appWindow = getCurrentWindow();
  const manualResized = ref(false);

  // DOM ref 绑定（替代 querySelector，解除窗口↔模板结构耦合）
  const elBubbleHead = ref<HTMLElement | null>(null);
  const elChatlog = ref<HTMLElement | null>(null);
  const elInput = ref<HTMLElement | null>(null);
  const elZero = ref<HTMLElement | null>(null);
  const elPixel = ref<HTMLElement | null>(null);

  // ── 尺寸/位置 ──
  async function resizeAnchored(size: LogicalSize) {
    const pos = await appWindow.outerPosition();
    const sz = await appWindow.outerSize();
    // 左下角锚定：底部（零脚底）不动，顶部伸缩
    const dy = sz.height - size.height;
    await appWindow.setPosition(new PhysicalPosition(pos.x, pos.y + dy));
    await appWindow.setSize(size);
  }

  async function clampToScreen() {
    const mon = await currentMonitor();
    const pos = await appWindow.outerPosition();
    const sz = await appWindow.outerSize();
    if (!mon) return;
    const mw = mon.size.width;
    const mh = mon.size.height;
    let { x, y } = pos;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + sz.width > mw) x = mw - sz.width;
    if (y + sz.height > mh) y = mh - sz.height;
    if (x !== pos.x || y !== pos.y) {
      await appWindow.setPosition(new PhysicalPosition(x, y));
    }
  }

  /** 高度贴合内容（底部锚定；chatOpen 由外部传入） */
  async function fitToContent(chatOpen: boolean) {
    if (!chatOpen || manualResized.value) return;
    const h = (el: HTMLElement | null) => el?.clientHeight ?? 0;
    const bubbleH = h(elBubbleHead.value) + h(elChatlog.value) + h(elInput.value) + 12;
    const zeroH = Math.max(h(elZero.value), h(elPixel.value));
    const idealH = Math.min(Math.max(Math.max(bubbleH, zeroH) + 8, 400), 520);
    const pos = await appWindow.outerPosition();
    const sz = await appWindow.outerSize();
    const dy = sz.height - idealH;
    await appWindow.setPosition(new PhysicalPosition(pos.x, pos.y + dy));
    await appWindow.setSize(new PhysicalSize(sz.width, idealH));
    await clampToScreen();
  }

  // ── 拖拽移动窗口 ──
  const drag = ref({
    active: false,
    ready: false,
    moved: false,
    sx: 0,
    sy: 0,
    wx: 0,
    wy: 0,
    mw: 0,
    mh: 0,
    ww: 0,
    wh: 0,
  });

  function onMouseDown(e: MouseEvent, headOrZero: boolean) {
    if (!headOrZero) return;
    const d = drag.value;
    d.active = true;
    d.ready = false;
    d.moved = false;
    d.sx = e.screenX;
    d.sy = e.screenY;
    Promise.all([appWindow.outerPosition(), currentMonitor(), appWindow.outerSize()])
      .then(([p, mon, sz]) => {
        d.wx = p.x;
        d.wy = p.y;
        d.ww = sz.width;
        d.wh = sz.height;
        d.mw = mon?.size.width ?? 0;
        d.mh = mon?.size.height ?? 0;
        d.ready = true;
      })
      .catch(() => {
        d.active = false;
      });
  }

  function onMouseMove(e: MouseEvent, dragging: (v: boolean) => void) {
    const d = drag.value;
    if (!d.active || !d.ready) return;
    const dx = e.screenX - d.sx;
    const dy = e.screenY - d.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      d.moved = true;
      dragging(true);
    }
    if (!d.moved) return;
    let nx = d.wx + dx;
    let ny = d.wy + dy;
    if (d.mw > 0) {
      nx = Math.min(Math.max(nx, 0), d.mw - d.ww);
      ny = Math.min(Math.max(ny, 0), d.mh - d.wh);
    }
    appWindow.setPosition(new PhysicalPosition(nx, ny));
  }

  function onMouseUp(dragging: (v: boolean) => void): boolean {
    const d = drag.value;
    const wasClick = d.active && !d.moved;
    d.active = false;
    dragging(false);
    if (d.moved) savePos();
    return wasClick;
  }

  // ── 手动 resize（SouthEast 手柄） ──
  const mResize = ref({
    active: false,
    ready: false,
    dir: "" as ResizeDir,
    sx: 0,
    sy: 0,
    wx: 0,
    wy: 0,
    ww: 0,
    wh: 0,
  });

  async function startResize(e: MouseEvent, dir: ResizeDir) {
    e.stopPropagation();
    manualResized.value = true;
    const r = mResize.value;
    r.active = true;
    r.ready = false;
    r.dir = dir;
    r.sx = e.screenX;
    r.sy = e.screenY;
    try {
      const [pos, sz] = await Promise.all([appWindow.outerPosition(), appWindow.outerSize()]);
      r.wx = pos.x;
      r.wy = pos.y;
      r.ww = sz.width;
      r.wh = sz.height;
      r.ready = true;
    } catch {
      r.active = false;
    }
  }

  function onResizeMove(e: MouseEvent) {
    const r = mResize.value;
    if (!r.active || !r.ready) return;
    if (e.buttons === 0) {
      endResize();
      return;
    }
    const dx = e.screenX - r.sx;
    const dy = e.screenY - r.sy;
    let { wx, wy, ww, wh } = r;
    const d = r.dir;
    if (d === "SouthEast") {
      ww = Math.max(ww + dx, timings.chatWidthMin);
      wh = Math.max(wh + dy, 200);
    } else if (d === "South") {
      wh = Math.max(wh + dy, 200);
    } else if (d === "East") {
      ww = Math.max(ww + dx, timings.chatWidthMin);
    } else if (d === "West") {
      const newW = Math.max(ww - dx, timings.chatWidthMin);
      wx = wx + (ww - newW);
      ww = newW;
    } else if (d === "North") {
      const newH = Math.max(wh - dy, 200);
      wy = wy + (wh - newH);
      wh = newH;
    }
    // rAF 节流：每帧只应用一次（防高频 setSize 导致内容实时重排闪烁）
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(() => {
      appWindow.setPosition(new PhysicalPosition(Math.round(wx), Math.round(wy)));
      appWindow.setSize(new PhysicalSize(Math.round(ww), Math.round(wh)));
      resizeRAF = undefined;
    });
  }
  let resizeRAF: number | undefined;

  function endResize() {
    const r = mResize.value;
    if (!r.active) return;
    r.active = false;
    r.ready = false;
  }

  function isResizing() {
    return mResize.value.active;
  }

  // ── 位置记忆 ──
  function savePos() {
    appWindow.outerPosition().then((p) => localStorage.setItem(POS_KEY, JSON.stringify(p)));
  }

  async function restorePosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (saved) {
        await appWindow.setPosition(new PhysicalPosition(saved.x, saved.y));
        return;
      }
    } catch {
      /* 无记录 */
    }
    await invoke("snap_to_corner");
  }

  // ── 散步/动画用的移动接口（动画层只能调这些） ──
  async function moveTo(x: number, y: number) {
    await appWindow.setPosition(new PhysicalPosition(Math.round(x), Math.round(y)));
  }

  async function getPos() {
    return appWindow.outerPosition();
  }

  async function getSize() {
    return appWindow.outerSize();
  }

  async function getScreenSize() {
    const mon = await currentMonitor();
    return mon ? { w: mon.size.width, h: mon.size.height } : { w: 0, h: 0 };
  }

  async function snapToCorner() {
    await invoke("snap_to_corner");
  }

  async function setSize(w: number, h: number) {
    await appWindow.setSize(new PhysicalSize(Math.round(w), Math.round(h)));
  }

  async function setResizable(v: boolean) {
    await appWindow.setResizable(v);
  }

  async function setAlwaysOnTop(v: boolean) {
    await appWindow.setAlwaysOnTop(v);
  }

  async function enterChat(chatWidth: number) {
    await appWindow.setResizable(true);
    await appWindow.setMinSize(new PhysicalSize(timings.chatWidthMin, 400));
    // 固定聊天窗尺寸（正常聊天框，不做高度自适应）
    await resizeAnchored(new LogicalSize(chatWidth, timings.chatH));
  }

  async function exitChat() {
    await appWindow.setResizable(false);
    await resizeAnchored(new LogicalSize(timings.petW, timings.petH));
  }

  return {
    appWindow,
    manualResized,
    elBubbleHead,
    elChatlog,
    elInput,
    elZero,
    elPixel,
    fitToContent,
    clampToScreen,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    startResize,
    onResizeMove,
    endResize,
    isResizing,
    moveTo,
    getPos,
    getSize,
    getScreenSize,
    snapToCorner,
    setSize,
    setResizable,
    setAlwaysOnTop,
    enterChat,
    exitChat,
    savePos,
    restorePosition,
  };
}
