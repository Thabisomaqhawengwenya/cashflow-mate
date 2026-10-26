# DeepSeek Bridge & Socket

A bi-directional event bridge and local socket server connecting **DeepSeek** and **Google Antigravity**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              DeepSeek                                  │
│  (CLI notify / HTTP POST / Named Pipe / Programmatic Client)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               POST http://127.0.0.1:45124/notify
               or \\.\pipe\deepseek-bridge
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DeepSeek Bridge Server (server.mjs)                  │
│  - Named Pipe: \\.\pipe\deepseek-bridge                                │
│  - HTTP & SSE: http://127.0.0.1:45124                                  │
│  - Native Windows Toast Dispatcher (PowerShell & Antigravity CDP)       │
│  - Event Log: .state/events.jsonl                                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Antigravity Watcher (watch.mjs --once)                  │
│  Runs as background task in Antigravity. When DeepSeek emits an event, │
│  watcher prints JSON and exits 0, waking Antigravity immediately!     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start for DeepSeek

### 1. Notify from the CLI
Whenever DeepSeek finishes a turn, edits files, or runs a task:

```powershell
node tools/deepseek-bridge/notify.mjs --summary "Completed debt calculation logic"
```

or with full event metadata:

```powershell
node tools/deepseek-bridge/notify.mjs --event deepseek.turn.completed --summary "Refactored Expo storage module" --file "my-app/services/storage.ts"
```

Or using the npm shortcut:

```powershell
npm run deepseek:notify -- --summary "Finished task"
```

### 2. Notify via HTTP (cURL / Fetch / Python)
Any environment can send a quick HTTP POST:

```powershell
curl -X POST http://127.0.0.1:45124/notify `
  -H "Content-Type: application/json" `
  -d '{"event":"deepseek.turn.completed","summary":"Finished API tests"}'
```

---

## Quick Start for Antigravity

To wait for DeepSeek to complete an action:

```powershell
node tools/deepseek-bridge/watch.mjs --once
```

- If `server.mjs` is not running, `watch.mjs` automatically starts it in the background.
- Antigravity's runner runs this as a background task.
- The instant DeepSeek emits an event:
  1. `watch.mjs` outputs the event JSON and exits code `0`.
  2. Antigravity receives the wake-up notification in its context.
  3. A native Windows notification pop-up alerts Mr Q on his desktop.

---

## Files

| Path | Purpose |
| --- | --- |
| `server.mjs` | Socket & HTTP server (Named Pipe `\\.\pipe\deepseek-bridge` + `http://127.0.0.1:45124`) |
| `watch.mjs` | Listener CLI used by Antigravity to wait for DeepSeek events |
| `notify.mjs` | CLI used by DeepSeek to fire events |
| `client.mjs` | ESM Node.js module export for programmatic notifications |
| `toast.ps1` | Native Windows toast notification script |
| `.state/events.jsonl` | Append-only event history log |
