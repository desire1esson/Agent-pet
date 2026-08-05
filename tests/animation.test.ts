import { describe, it, expect } from "vitest";
import { validateAnimation, animations } from "../src/config/animations";
import { matchDef, resolveDefs } from "../src/lib/animationMatch";
import { bus } from "../src/lib/events";
import { registerEffect, hasEffect } from "../src/composables/useLifeCycle";
import type { AnimationDef } from "../src/config/animations";

describe("validateAnimation（配置校验）", () => {
  it("内置动画全部有效", () => {
    for (const a of animations) {
      expect(validateAnimation(a), `动画 ${a.id} 应有效`).toBeNull();
    }
  });

  it("拒绝缺失 id", () => {
    expect(validateAnimation({ id: "", trigger: {}, effect: "x", duration: 100 })).not.toBeNull();
  });

  it("拒绝 event 与 afterMs 并存", () => {
    expect(
      validateAnimation({ id: "bad", trigger: { event: "user:click", afterMs: 1000 }, effect: "x", duration: 100 }),
    ).not.toBeNull();
  });

  it("拒绝非法 chance", () => {
    expect(
      validateAnimation({ id: "bad", trigger: { chance: 1.5 }, effect: "x", duration: 100 }),
    ).not.toBeNull();
  });
});

describe("matchDef（触发条件匹配）", () => {
  it("event 不匹配则 false", () => {
    const def: AnimationDef = { id: "a", trigger: { event: "user:click" }, effect: "x", duration: 100 };
    expect(matchDef(def, { type: "user:send", ts: 0 }, "idle")).toBe(false);
    expect(matchDef(def, { type: "user:click", ts: 0 }, "idle")).toBe(true);
  });

  it("state 要求不满足则 false", () => {
    const def: AnimationDef = { id: "a", trigger: { state: "idle" }, effect: "x", duration: 100 };
    expect(matchDef(def, { type: "time:idle", ts: 0 }, "thinking")).toBe(false);
    expect(matchDef(def, { type: "time:idle", ts: 0 }, "idle")).toBe(true);
  });

  it("contains 关键词匹配消息文本", () => {
    const def: AnimationDef = { id: "dance", trigger: { event: "user:send", contains: "跳舞" }, effect: "dance", duration: 100 };
    expect(matchDef(def, { type: "user:send", ts: 0, payload: { text: "来跳舞吧" } }, "idle")).toBe(true);
    expect(matchDef(def, { type: "user:send", ts: 0, payload: { text: "你好" } }, "idle")).toBe(false);
  });
});

describe("resolveDefs（优先级仲裁）", () => {
  it("priority 大者胜", () => {
    const low: AnimationDef = { id: "low", trigger: {}, effect: "a", duration: 100, priority: 10 };
    const high: AnimationDef = { id: "high", trigger: {}, effect: "b", duration: 100, priority: 100 };
    expect(resolveDefs([low, high])?.id).toBe("high");
  });

  it("空列表返回 null", () => {
    expect(resolveDefs([])).toBeNull();
  });

  it("无 priority 按 0 处理", () => {
    const noPri: AnimationDef = { id: "n", trigger: {}, effect: "a", duration: 100 };
    const withPri: AnimationDef = { id: "p", trigger: {}, effect: "b", duration: 100, priority: 5 };
    expect(resolveDefs([noPri, withPri])?.id).toBe("p");
  });
});

describe("bus（事件总线）", () => {
  it("on/emit/off 生命周期", () => {
    let hit = 0;
    const off = bus.on("user:click", () => hit++);
    bus.emit("user:click");
    expect(hit).toBe(1);
    off();
    bus.emit("user:click");
    expect(hit).toBe(1);
  });

  it("payload 传递", () => {
    let got: unknown;
    const off = bus.on("user:send", (e) => (got = e.payload?.text));
    bus.emit("user:send", { text: "hello" });
    expect(got).toBe("hello");
    off();
  });

  it("监听器异常不中断其他监听器", () => {
    const off1 = bus.on("user:click", () => {
      throw new Error("boom");
    });
    let hit = 0;
    const off2 = bus.on("user:click", () => hit++);
    bus.emit("user:click");
    expect(hit).toBe(1);
    off1();
    off2();
  });
});

describe("行为注册表（useLifeCycle 扩展点）", () => {
  it("内置行为已注册", () => {
    for (const name of ["yawn", "look", "scratch", "stretch", "rub", "walk", "sleep", "happy", "dance", "drag"]) {
      expect(hasEffect(name), `内置行为 ${name} 应已注册`).toBe(true);
    }
  });

  it("社区可注册新行为", () => {
    let called = false;
    registerEffect("test-roll", () => {
      called = true;
    });
    expect(hasEffect("test-roll")).toBe(true);
  });
});
