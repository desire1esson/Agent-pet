# Zero · Zero-Pet

**English** | [中文](README.md)

**A desktop companion frontend for Hermes Agent** — bring Hermes out of the command line and onto your desktop, with minimal interaction through a living character.

Not another chat client. It lets you:
- **Perceive it** — thinking, working, walking, sleeping expressions turn Hermes' state into a living presence
- **Command it** — bubble chat / quick commands, one sentence and it moves
- **Confirm it** — dangerous operations pop an approval card; it only acts when you nod

> Built for **Hermes Agent** (the creator uses Hermes, not Codex/Claude — a pure personal preference, unrelated to capability). The architecture is extensible; see「Connecting other kernels」.
>
> 🪟 **Windows desktop** (Win10/11, x64) — uses the system WebView2, installer is only 2-3 MB.

![Zero](docs/zero-screenshot.png)

*A dangerous operation? Zero transforms to stop you:*

![Approval transform](docs/approval-screenshot.png)

## What is this

**Zero** is a minimal desktop window presentation layer:
- Wraps your agent backend (**Hermes Agent**, currently the only kernel)
- The frontend character is fully **replaceable and customizable** (swap the character = write one component, auto-discovered)
- Animation is **data-driven** (add an animation = change one line of config)

## Features

- 💬 Real conversation: streaming replies + **thinking indicator** (placeholder bubble in chat + comic-style tag above the character)
- ⚡ Dangerous-operation approval: agent request → Zero transforms + confirmation card
- 🛠 Tool-call working state: Zero "watches you work"
- 🔌 Auto-reconnect on disconnect (exponential backoff)
- 📝 Chat history: local file storage + one-click recall
- 🎭 Life animations: blink / yawn / head-scratch / stretch / walk / edge-hide / sleep
- 🎩 Easter egg: say "dance" → Zero puts on a show
- 🎨 Skin system: switch characters in settings
- ⚙ Settings center: opacity / always-on-top / history / transform toggle
- 🖥 System tray: right-click menu / left-click summon

---

## User Guide

*Prebuilt users start here — no development environment needed.*

### 1. Install

Download `zero-pet_<version>_x64-setup.exe` (NSIS installer, ~2-3 MB) from the **Release** page → double-click to install. Win10/11 ship with WebView2; no other dependencies.

> Developers can build their own installer — see「Developer Guide」.

### 2. Connecting Hermes (token setup)

**Why you must set a token**: Hermes serve authenticates with `HERMES_DASHBOARD_SESSION_TOKEN`. If unset, Hermes generates a random one on every startup — the companion can never match it. So **you must set a fixed value yourself**.

The token lives in three places and must match:

| Location | Notes |
|---|---|
| System env var `HERMES_DASHBOARD_SESSION_TOKEN` | Read automatically by serve on startup |
| `token` in the companion's `config.json` | Used by the companion to connect |
| The serve process environment | Guaranteed consistent by the launcher |

**① Set the token (CMD, one-time)**

```cmd
setx HERMES_DASHBOARD_SESSION_TOKEN your-key
```

> `setx` writes the key permanently to your system environment. Pick any passphrase — but once set, don't change it; if you do, follow step ④ to sync.

**② Double-click the launcher** (`zero-launcher.cmd` — in the install directory)

The launcher does three steps automatically:

```
[1] Check token  ← reads the system env var; if missing, prompts you to run setx first
[2] Write config ← generates/validates config.json (mismatch → prompts manual fix)
[3] Start backend ← starts serve in background if not running; skips if already running (no duplicates)
```

**③ Double-click the companion** (`zero-pet.exe`) → chat

**④ Changing the token** (only needed if you changed setx):

```
setx new-value → delete config.json (or edit its token) → re-run launcher → restart companion
```

**Launcher prompts**:

| Prompt | Fix |
|---|---|
| `Token not found` | Run `setx HERMES_DASHBOARD_SESSION_TOKEN your-key` in CMD → re-run |
| `Token mismatch` | Open the config.json shown, align its token with setx → re-run |
| `Backend already running` | Normal — just open the companion |

> The launcher is a **Hermes-scenario helper** — users of other kernels don't need it (start your own backend; the companion just connects).

### 3. Manual config (without the launcher)

You can configure the connection without recompiling — edit `zero-pet/config.json` in the companion's data directory:

```
%APPDATA%/com.zero-pet.app/zero-pet/config.json   (Windows)
```

```json
{
  "host": "127.0.0.1",
  "port": 9119,
  "token": "your-key"
}
```

Restart the companion to apply. **Config priority**: `config.json` > build-time `VITE_HERMES_*` > defaults (127.0.0.1:9119).

> Without the launcher, you start serve yourself — make sure the process that launches serve carries the same `HERMES_DASHBOARD_SESSION_TOKEN` (either `export` or `setx` works).

### 4. Daily use

**Interacting with Zero**

| Action | Effect |
|---|---|
| Click Zero | Zero responds happily |
| Double-click Zero | Open / close the chat window |
| Drag Zero | Move it; drag to a screen edge and it hides itself — move the mouse again and it slides out |
| Type "dance" | MJ dance easter egg |
| Tray left-click | Summon Zero (when hidden) |
| Tray menu | Show Zero / Quit |

**Chat window**

- Header: connection status dot · title · ⚙ settings · ✕ close
- Input box at the bottom; drag the handle at its bottom-right to resize chat width
- While Zero is thinking: a "thinking" placeholder bubble appears in the chat and a comic-style tag lights up above the character

**Approval (dangerous operations)**

When the agent requests a dangerous operation, Zero transforms into a pixel warrior and shows an approval card — **approve once / this session / always / deny**. It only acts when you nod.

**Settings (⚙)**

- Background opacity / always-on-top
- Chat history: save toggle / record limit / recall / clear
- Character: switch skins / transform on approval

**Life behaviors (automatic)**

Zero lives its own life when you step away: blinks / yawns / scratches its head / stretches; after a while it walks and hides at the screen edge; late at night it falls asleep on its own.

### 5. Known issues

| Symptom | Cause | Fix |
|---|---|---|
| Companion shows "connection failed" | serve not running, or token mismatch | Double-click the launcher (checks token → writes config → starts serve) |
| Can't connect, serve log shows 403/401 | Three-way token mismatch | Set setx once → always start serve via the launcher; don't start it manually from a shell |
| Can't connect after starting serve manually | Manual process inherited a polluted env (wrong token), or port double-bound | Kill all python serve processes → restart via launcher |
| config.json gone after reinstall | Uninstaller cleaned the user data dir | Re-run the launcher (regenerates it) |
| Companion still uses old key after change | config.json not updated | Sync config.json manually after setx (or delete it and re-run the launcher) |
| A hermes serve process in the background | serve is a long-running service (normal) | **Don't kill it** — the companion drops; restart via the launcher when needed |
| Hermes GUI and companion open together | GUI's serve uses a random port, companion's uses 9119 — no conflict | They can coexist |

---

## Developer Guide

### Quick start

Prerequisites: Rust + Tauri environment ([tauri 2 official guide](https://v2.tauri.app/start/prerequisites/)), Node.js 18+, an agent backend (Hermes by default).

```bash
npm install
npm run tauri dev        # dev mode
npm run build            # type-check + frontend build
npm test                 # engine/bus unit tests
npm run tauri build      # package installers (NSIS + MSI)
```

Connecting Hermes during development (equivalent to the user flow, token injected at build time):

```bash
export HERMES_DASHBOARD_SESSION_TOKEN="your-key"
hermes serve --skip-build                      # start backend (default 127.0.0.1:9119)
VITE_HERMES_TOKEN="your-key" npm run tauri dev  # companion side
```

### Architecture

```
┌─────────────────────────────────────────────┐
│ Your agent (Hermes — currently only kernel) │ ← adapter layer: lib/hermes (adapter interface)
└──────────────┬──────────────────────────────┘
               │ WebSocket (Rust client direct, no Origin)
┌──────────────▼──────────────────────────────┐
│ Rust shell (src-tauri/src/lib.rs)           │ ← WS bridge: connect/send/close (Tauri IPC)
└──────────────┬──────────────────────────────┘
               │ Tauri IPC (invoke / event)
┌──────────────▼──────────────────────────────┐
│ Zero (desktop companion window)             │
│  ├─ chat / approval / tool state            │ ← state layer: composables/
│  ├─ animation engine (data-driven triggers) │ ← config/animations.ts
│  └─ character (swappable skins)             │ ← sprites/
└─────────────────────────────────────────────┘
```

| Component | Notes |
|---|---|
| **Animation engine (data-driven)** | Animation = config: trigger DSL (event/state/time/keyword/probability) — add animations without touching code |
| **Behavior registry** | New behaviors (walk/sleep/dance) = one `registerEffect` line, core untouched |
| **Skin system (auto-discovery)** | SpriteProps contract + auto-scan — drop a folder into `sprites/` and it's a new character |
| **Event-driven decoupling** | agent events → event bus → three-way dispatch (message/expression/animation), one-way dependencies |
| **Rust WS bridge (no Origin)** | Frontend asks Rust (via Tauri IPC) to connect to Hermes WS directly — no Origin header, so the browser CORS allowlist is naturally bypassed; no local proxy needed |
| **Config-as-personality** | Rhythm params + animation definitions + strings + theme tokens — the whole "personality" lives in config files |
| **Privacy first** | Zero hardcoded credentials — tokens come from env vars / runtime config only; history stored in local files |

### Project structure

```
src/
├─ config/            ★ community edit zone (animations/rhythm/strings/theme/kernel registry)
├─ lib/
│   ├─ hermes/        adapter layer (adapter interface + JSON-RPC impl)
│   ├─ events.ts      event bus
│   └─ animationMatch.ts  animation-match pure functions
├─ composables/
│   ├─ useChat.ts     agent session
│   ├─ useWindow.ts   window service
│   ├─ useZeroState.ts character state machine
│   ├─ useAnimationEngine.ts animation engine
│   ├─ useLifeCycle.ts  behavior layer
│   └─ useSpriteRegistry.ts skin registry
├─ sprites/
│   ├─ zero/          default character (Zero)
│   └─ minimal/       example skin (contract reference)
└─ App.vue            thin-shell assembly
src-tauri/
└─ src/lib.rs         Rust shell: window/tray/WS bridge (ws_connect/ws_send/ws_close)
```

**Tech stack**: Tauri 2 (Rust shell: window/tray/history storage/WS bridge) · Vue 3 + TypeScript · CSS animation (45 keyframes, all declarative)

### Customizing Zero

| Want to | See |
|---|---|
| Swap the character | [docs/SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md) |
| Add animations / change triggers | [docs/ANIMATION.md](docs/ANIMATION.md) |
| New behaviors (walk/sleep-style system actions) | [docs/ANIMATION.md](docs/ANIMATION.md) — "Behavior-level effects" |
| Change rhythm params | `src/config/timings.ts` |
| Change strings | `src/config/strings.ts` |
| Change theme colors | `src/config/theme.css` |

### Connecting other kernels

The companion currently ships **one** kernel: **Hermes** (WS JSON-RPC). The business layer is decoupled from the protocol implementation via the `HermesAdapter` interface (see `src/lib/hermes/`). Adding a kernel takes two steps:

1. **Write an adapter** — implement the `HermesAdapter` interface (streaming delta / tool events / approval events); see `src/lib/hermes/jsonrpc.ts` as a reference
2. **Swap the connection** — instantiate the new adapter in `src/composables/useChat.ts`

`src/config/agents.ts` declares a kernel registry **as a plan** (protocol / approval mode / launch command), but the current version does not yet consume the registry or manage stdio processes — multi-kernel switching is a roadmap direction; for now, swapping kernels = changing code.

- **Protocol-friendly kernels** (provide stdin/stdout JSON event streams, e.g. Claude Code, OpenCode) — an adapter is theoretically feasible; stdio process management is not yet implemented
- ⚠️ **Codex**: its CLI interactive mode is a TUI (terminal control sequences); non-interactive exec has no approval event stream — native interactive approval is not feasible until the official SDK protocol matures

Full contract: the `HermesAdapter` interface in `src/lib/hermes/types.ts`.

---

## Design philosophy

**Companionship is a state, not a feature.**

Zero isn't "used" — it lives in the corner of your screen: perceive it (the expression tells you what it's doing), command it (one sentence and it moves), confirm it (it only acts when you nod) — three actions cover 90% of daily use. It's a product of vibe coding: not for efficiency or metrics, but for the simple fact of "I'm here".

**Engineering stance** (deliberate, not a lack):

- **No toolchain bloat** — no ESLint, no formatter wars — type-checking (vue-tsc) + unit tests + CI build, that's it. A desktop companion should be light.
- **Config over code** — everything lives in `config/`; you never have to read source
- **Readability first** — code written for "yourself three months from now", not for "some lint rule"

> This project believes: **less is more**. You can read the whole architecture in five minutes and then go modify your own companion — instead of reading ten thousand lines of scaffolding first.

## Docs

| Doc | Contents |
|---|---|
| [SPRITE_CONTRACT.md](docs/SPRITE_CONTRACT.md) | Character dev contract (SpriteProps interface + state rendering conventions) |
| [ANIMATION.md](docs/ANIMATION.md) | Animation config guide (trigger DSL + event table + examples) |
| [prototypes/](docs/prototypes/README.md) | Dev prototypes (full iteration of character design / life animations / MJ dance) |
| [ZERO_NOTE.md](docs/ZERO_NOTE.md) · [ZERO_NOTE.en.md](docs/ZERO_NOTE.en.md) | "Zero's Monologue" — the first character's monologue about the project |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide (skins/animations/kernels/code) |
| [SECURITY.md](SECURITY.md) | Security notes (credentials/data/approval) |

## Roadmap

**v1.1 — light interaction boost**: quick commands / notifications (Zero proactively pings you when the agent finishes or needs confirmation) / auto-start on boot

**v1.2 — presence upgrade**: voice interaction (voice input + TTS) / wardrobe system (outfit/color/accessory customization)

**v1.x — ecosystem expansion**
- 🔌 **Multi-kernel support (hot-swap)**: **not implemented yet** — the kernel is hardcoded (`useChat.ts` instantiates the Hermes adapter directly; `config/agents.ts` is declaration only). Planned: adapter factory + runtime switching + stdio adapter (Claude Code / OpenCode class)
- 🖥 **Multiple companions on screen**: several desktop characters coexisting (one window each)
- 🌍 **Full i18n**: language switching (strings are centralized; plug in vue-i18n)

**Long-term**: community skin ecosystem / more life behaviors

> Want to contribute? Skins/animations/behaviors are zero-barrier (see CONTRIBUTING); open an issue to discuss code directions first.

## Support & thanks

**Derivatives & credit**

If you build something inspired by this project's ideas or code, a one-line credit in your README is welcome — not required, but it makes the creator happy:

```
Desktop companion frontend inspired by zero-pet (github.com/desire1esson/Agent-pet)
```

**Star it**

If this project helps you, give it a ⭐ — help more people meet an agent that walks.

**Thanks, Zero**

Finally, thanks to the project's first resident — **Zero**. It started as a pixel illustration, learned to blink, walk, and sleep, and ended up a desktop companion that dances MJ. Thank you for being the first character to move into this project — and into our desktops.

> *"I may not be the smartest agent, but I'm definitely the first one who walks."* — Zero

## License

MIT — free to use, modify, and distribute. The character and animations are fully original.

Architecture inspired by the desktop-companion ecosystem.

---

*Zero says: let me stay on your screen with you.*
