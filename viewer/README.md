# Harness Inspector (request-logger viewer)

A React + Vite UI for the captures in `logs/`. It is not a separate package: it
uses the `package.json`, `node_modules`, tsconfig and test setup at the repo
root, so run everything below from there.

```bash
npm install   # once
npm run ui
```

Open http://localhost:5180. It listens on 127.0.0.1 only: the captures contain
your account and device ids. Point it at another folder with `LOGS_DIR=...`.

If it stops with `Port 5180 is already in use`, another viewer is running. Stop
that one, or pick another port:

```bash
npm run ui -- --port 5181
```

## What it shows

- **Sessions** — grouped by the `session_id` Claude Code puts in `metadata.user_id`.
- **Turns** — one per prompt you typed (or a message from another session),
  holding every API call until the model stops.
- **Call kinds**
  - `main` — your conversation thread.
  - `subagent` — threads with a different system prompt (e.g. the Agent tool).
  - `side` — housekeeping: tool-less calls (session title), and forks of a
    thread the harness sends on its own: prompt suggestions, progress
    summaries, away recaps, `/compact` summaries. Recognised by `HARNESS_FORKS` in `server/parse.ts`,
    or because the next call in the thread did not carry them forward.
- **Owner** (separate from kind) — a side call keeps the thread it forked
  from, because a fork reuses that thread's system prompt. So badges read
  `main`, `main · side` (prompt suggestions, away recaps), `subagent N`,
  `sub N · side` (progress summaries) and `session` (tool-less: title, quota).
  The colour is the owner's; side calls are hollow and dashed. Turns has a
  toggle for each group, plus one chip per subagent that hides everything it
  owns.
- **Subagents** — numbered by first call, each with its own colour (badges,
  row edges, chart strip, inspector), and named after the `Agent`/`Task` tool
  call that spawned it (its `prompt` reappears as the subagent's first
  message). The panel is a shared timeline: dashed = spawned but not yet
  running, bar = running, ticks = API calls (click to inspect), ◂ = when the
  main thread received the report. Click a row for the task, the report the
  main agent got, tool counts, token stats and every step. Background agents
  are followed through their hand-back: launch ack (`agentId`) →
  `<agent-message from="agentId">` (the report) → `<task-notification>`
  (status). In Turns, coloured chips filter subagents one by one.
- **Context window per call** — cache read / cache write / uncached input /
  output, straight from the response's `usage`. Dashed markers show
  `/compact` (amber, after the summary call) and rewinds (cyan, before the
  first call whose thread shrank while keeping its first message).
- **Call inspector → What's new** — each request resends the whole history,
  so the viewer diffs against the previous call in the same thread and shows
  only what the harness appended: tool results, `<system-reminder>`s (marked
  "injected by harness"), your prompt.
- **Context composition** — an *estimate*: the call's real token count split by
  the character share of system prompt, tool schemas, history and new content.

## Reading captures from another folder

The viewer only needs a folder of captures (`*.request.txt` + `*.response.txt`
pairs written by `proxy/proxy.ts`). It never imports the proxy, so it can read
any such folder, including one from another repo:

```bash
LOGS_DIR=/path/to/other/logs npm run ui
```

Run it from this repo. The other folder is only read, and new captures appear
live because the viewer watches whatever `LOGS_DIR` points to.

## How it works

`server/plugin.ts` is a Vite plugin that serves `/api/*` from the dev server
and pushes `/api/events` (SSE) when `fs.watch` sees a new `.response.txt`.
All parsing is pure and unit-tested in `server/parse.ts`.
