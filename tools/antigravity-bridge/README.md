# Antigravity Bridge

A local socket bridge that watches the running **Google Antigravity** IDE and emits a
notification event whenever its agent finishes a turn.

```
Antigravity renderer (Electron)
        │  CDP WebSocket  ws://127.0.0.1:<DevToolsActivePort>/devtools/page/<id>
        ▼
   bridge.mjs  ── named pipe  \\.\pipe\antigravity-bridge  ──▶  watch.mjs
        │                                                        │
        ├─ .state/events.jsonl  (append-only event log)          ├─ prints one JSON event
        ├─ .state/bridge.log    (diagnostics)                    └─ exits 0  ──▶ DeepSeek Harness
        └─ native Windows notification via Antigravity            background-job notification
```

## How it connects

Antigravity is an Electron app. On launch it writes its Chrome DevTools port to:

```
%APPDATA%\Antigravity\DevToolsActivePort
```

The bridge reads that port, finds the conversation page (`https://127.0.0.1:<port>/c/<conversation-id>`),
opens the DevTools **WebSocket**, and injects a read-only observer into the renderer. The observer
watches the UI's own agent indicators:

- `[data-testid="agent-loading"]` (the "Working" spinner)
- `button[aria-label="Stop execution"]`

When that state goes **true → false** (after a short settle window), the bridge publishes
`agent.turn.completed`. It never modifies Antigravity's files, messages, or DOM; it only reads
state and uses Antigravity's own `window.nativeNotifications` API for the desktop toast.

## Quick start

```powershell
# 1. Start the bridge (keep it running)
node tools/antigravity-bridge/bridge.mjs

# 2. Wait for the next completed Antigravity turn
node tools/antigravity-bridge/watch.mjs --once

# 3. Or stream every event while developing
node tools/antigravity-bridge/watch.mjs --verbose
```

`watch.mjs` auto-starts the bridge in the background if it is not already running.

### Useful flags

| Script | Flag | Meaning |
| --- | --- | --- |
| `bridge.mjs` | `--no-toast` | Do not raise a Windows notification on completion |
| `bridge.mjs` | `--toast-test` | Send one test notification when it attaches |
| `bridge.mjs` | `--pipe <path>` | Override the named pipe path |
| `watch.mjs` | `--once` | Exit after the first matching event |
| `watch.mjs` | `--event <name[,name]>` | Events to match (`agent.turn.completed` by default, `all` for everything) |
| `watch.mjs` | `--timeout <seconds>` | Exit with code `2` after the timeout |
| `watch.mjs` | `--no-ensure` | Fail instead of auto-starting the bridge |
| `watch.mjs` | `--verbose` | Log connection/event diagnostics to stderr |

## Events

Newline-delimited JSON on stdout and on the named pipe.

```json
{
  "event": "agent.turn.completed",
  "ts": "2026-10-26T10:51:12.842Z",
  "source": "antigravity-bridge",
  "version": "1.0.0",
  "conversationId": "990abc39-bf43-4f6f-8833-35f1563e9c97",
  "title": "AI CashFlow Mate Setup - money-app - Antigravity",
  "durationMs": 132000,
  "durationSource": "observed",
  "workedFor": "Worked for 2m",
  "workedCount": 5,
  "lastAssistantText": "…the last ~800 characters of the final assistant message…"
}
```

Other events: `bridge.hello`, `bridge.attached`, `agent.turn.started`.

## DeepSeek Harness pattern

Run the watcher as a background job. The harness notifies the agent when the job finishes,
which is exactly the "tell me when Antigravity is done" signal:

```
node tools/antigravity-bridge/watch.mjs --once --event agent.turn.completed
```

When Antigravity completes its next turn the watcher prints the event and exits `0`; the agent
wakes up with the result. Start it again to wait for the following turn.

## Files

| Path | Purpose |
| --- | --- |
| `.state/events.jsonl` | Append-only event history (safe to tail) |
| `.state/bridge.log` | Bridge lifecycle log |
| `.state/bridge.json` | Live state: pid, pipe path, attached, conversation, working |

`.state/` is git-ignored.

## Notes and limits

- Antigravity must be running with its agent window open. If it is closed, the bridge retries
  every 3 seconds and re-attaches automatically when it comes back.
- The DevTools port is loopback-only; the bridge does not open any network port. The named pipe
  is local to the Windows user session.
- Completion detection is UI-based, so it follows what Antigravity shows the user. A long
  permission prompt or a paused agent keeps the state "working" until it actually finishes.
- If Antigravity is upgraded and its renderer markup changes, update the two selectors in
  `OBSERVER_SOURCE` inside `bridge.mjs`.
