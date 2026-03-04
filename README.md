# Synapse

Your second brain, in your pocket.

Synapse connects your Obsidian vault to Telegram through Claude, giving you a conversational interface to your entire knowledge base from your phone. Capture thoughts on the go, search your notes by asking questions, snap photos of receipts or whiteboards and file them into the right place — all through a chat that understands what you mean, not just what you type.

Built on three pieces that work together:
- **[Obsidian](https://obsidian.md)** — your vault, the source of truth
- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — the AI that reads, writes, and reasons about your notes
- **[Obsidian MCP Server](https://github.com/jason-c-dev/obsidian-mcp)** — the bridge that gives Claude direct access to your vault via 16 MCP tools

## Why This Exists

Most "AI + notes" tools bolt a chatbot onto a search index. Synapse is different — Claude doesn't just search your vault, it **writes to it**. It creates notes, appends to your daily log, extracts action items, links related ideas, and maintains your knowledge graph with the same conventions you use. It's not a viewer, it's a collaborator.

The session system means Claude remembers your earlier messages throughout the day. Ask it to capture something in the morning, then reference it in the afternoon — it knows. When the session ends, Claude does a reconciliation pass: reviewing the conversation, capturing anything missed, and writing a summary to your daily note. Nothing falls through the cracks.

And because it runs on your machine through Claude Code, there's no middleware — no extra SaaS layer, no third-party database, no additional cloud service sitting between you and your notes. Your vault, your bot, your Claude account. You control the entire pipeline.

## How It Works

```
Telegram message
  → Telegraf bot (long polling)
    → Message queue (per-user, sequential)
      → claude -p "your message" --output-format stream-json
        → Tool call events streamed to Telegram as progress updates
        → Claude calls MCP tools to read/write vault
      → Response formatted for Telegram
    → Reply sent back
```

Sessions persist throughout the day (or a configurable window), so Claude remembers earlier messages. When a session expires, Claude does a final reconciliation pass — reviewing the conversation, capturing anything missed, and appending a summary to your daily note.

## Quick Start

Have [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed? Run the setup wizard:

```bash
bash <(curl -sL https://raw.githubusercontent.com/jason-c-dev/synapse/main/install.sh)
```

The wizard detects your environment, installs dependencies, and walks you through configuration interactively. Safe to re-run for repairs and updates.

Already cloned the repo? Run it locally:

```bash
claude "$(cat setup.md)"
```

For manual setup, see [Prerequisites](#prerequisites) below.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- [Obsidian MCP Server](https://github.com/jason-c-dev/obsidian-mcp) configured in your Claude Code global settings
- Node.js 20+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- Your Telegram user ID (from [@userinfobot](https://t.me/userinfobot))

## Telegram Setup

Before you can run the bot, you need a Telegram bot token and your user ID.

### Creating a Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather) (the official Telegram tool for creating bots)
2. Send `/newbot`
3. Choose a display name (e.g. "Synapse")
4. Choose a username — must end in `bot` (e.g. `my_vault_bot`)
5. BotFather will reply with an API token — copy this for `BOT_TOKEN`

For more details, see the [Telegram Bot API documentation](https://core.telegram.org/bots#how-do-i-create-a-bot).

### Getting Your User ID

The bot is locked to specific Telegram user IDs so only you can use it. To find yours:

1. Open Telegram and search for [@userinfobot](https://t.me/userinfobot)
2. Send it any message
3. It replies with your numeric user ID — copy this for `ALLOWED_USER_IDS`

You can add multiple user IDs as a comma-separated list if you want to allow others access.

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/jason-c-dev/synapse.git
   cd synapse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example env and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Verify Claude can reach your vault:
   ```bash
   claude -p "read today's daily note" --output-format json --dangerously-skip-permissions
   ```

5. Start the bot:
   ```bash
   npm start
   ```

   Or with auto-reload during development:
   ```bash
   npm run dev
   ```

   For verbose output while debugging:
   ```bash
   npm run dev:debug
   ```

   To write debug logs to a file (useful with `tail -f synapse.log`):
   ```bash
   npm run dev:log
   ```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | Yes | — | Telegram bot token from BotFather |
| `ALLOWED_USER_IDS` | Yes | — | Comma-separated Telegram user IDs allowed to use the bot |
| `SESSION_EXPIRY` | No | `daily` | `"daily"` for day-based sessions, or a number for minutes |
| `CLAUDE_TIMEOUT` | No | `120000` | Max milliseconds to wait for Claude to respond |
| `VAULT_PATH` | For images | — | Absolute path to your Obsidian vault. Required for photo support |
| `IMAGE_TEMP_DIR` | No | OS temp dir | Directory for temporary image files passed to Claude for analysis |
| `PROGRESS_MODE` | No | `off` | Progress feedback during Claude processing: `off` (typing indicator only), `standard` (acknowledgment + generic activity labels), `detailed` (tool names, inputs, and cost summary) |
| `QUEUE_DEPTH` | No | `3` | Maximum queued messages per user. Messages beyond this limit are rejected |
| `LOG_LEVEL` | No | `info` | Logging verbosity: `error`, `warn`, `info`, or `debug` |
| `LOG_FILE` | No | — | Path to a log file. When set, all output is appended here in addition to the console |

## Usage

Send messages to your bot on Telegram. It understands natural language and maps your intent to vault operations:

- **"what's on my plate today?"** — reads your daily note and outstanding tasks
- **"capture: interesting idea about X"** — appends a timestamped entry to today's daily note
- **"find: session management"** — deep search across your vault
- **"log: finished the review"** — quick timestamped log entry
- **"note: Meeting Notes — discussed project timeline"** — creates a new structured note
- **Send a photo** with a caption — Claude sees the image, saves it to your vault, and files it into the right note
- **Free-form text** — Claude uses judgment to search, capture, or act

### Bot Commands

- `/reset` — flush the current session (reconcile + capture missed items) and start fresh
- `/status` — show current session info (ID, message count, last activity)

## Session Management

Sessions give Claude conversational memory across messages:

- **First message of the day** starts a new session
- **Subsequent messages** resume the same session, so Claude remembers context
- **Session expiry** triggers a reconciliation pass where Claude reviews the conversation, captures anything missed, and writes a summary to your daily note
- **`/reset`** manually triggers a flush and starts a new session

## Project Structure

```
├── CLAUDE.md          # System prompt, vault behavior, and MCP tool patterns
├── .env.example       # Environment variable template
├── package.json       # ESM, single dependency (telegraf)
├── src/
│   ├── bot.js         # Entry point: Telegraf, auth, commands, message handler
│   ├── claude.js      # Spawns claude -p with session management flags
│   ├── session.js     # Session lifecycle: create, resume, expire, flush
│   ├── config.js      # Env loading and validation
│   ├── format.js      # Obsidian markdown → Telegram formatting, message splitting
│   ├── progress.js    # Progress reporting: status messages, throttled edits, mode-aware formatting
│   ├── queue.js       # Per-user message queue with depth limits
│   └── log.js         # Leveled logger (error/warn/info/debug)
└── .claude/
    └── skills/        # Claude Code skill definitions (capture, find, log, complete-tasks, edit, etc.)
```

## Why `claude -p` and Not the Agent SDK

Synapse uses `claude -p` (Claude Code's prompt mode) rather than the Anthropic Agent SDK. Telegram is just the transport layer — each message is passed to Claude as if you were talking to it directly, with session flags for conversational memory.

This is a deliberate choice:

- **Fixed cost** — runs on Anthropic's Max plan (flat monthly fee), no per-token API charges. For personal use, this is significantly cheaper than the API
- **No API key required** — Claude Code authenticates via your subscription, not an API key
- **Terms-compliant** — stays on the right side of Anthropic's acceptable use for personal, non-commercial automation via Claude Code
- **Good enough for async chat** — response latency is acceptable for a Telegram bot where you're not expecting sub-second replies

**Roadmap: Agent SDK support.** For business and commercial use cases, a future version will support the Anthropic Agent SDK as an alternative invocation backend. This would provide faster responses through long-running sessions and streaming, but at higher cost (per-token API pricing). The invocation layer is largely isolated in `claude.js`, though session management (`session.js`) is currently coupled to `claude -p`'s CLI session model and would also need adapting.

## Design Decisions

- **Plain JavaScript, ESM, no build step** — simple wrapper, fast iteration
- **Single dependency** (Telegraf) — .env is parsed manually in config.js, no dotenv package, no TypeScript, no framework
- **Long polling** — personal bot running locally, no public URL needed for webhooks
- **`claude -p` over Agent SDK** — fixed-cost Max plan for personal use; Agent SDK on the roadmap for commercial deployments (see above)
- **`--dangerously-skip-permissions`** — required for non-interactive MCP tool use in `claude -p` mode
- **Legacy Markdown** for Telegram — MarkdownV2 requires escaping 18 special characters; legacy mode is forgiving enough for this use case
- **Vault is the database** — no SQLite, no Redis. Session state is one small JSON file; all real data lives in Obsidian
- **Configurable progress updates** — three modes (`off`/`standard`/`detailed`) control how much feedback the user sees during Claude processing. `off` preserves silent behavior for derived bots targeting non-technical users. `detailed` streams tool call names and inputs for power users. Progress uses a single editable Telegram message (send once, edit in place) to avoid chat clutter, with throttled edits (~1/second) to respect Telegram rate limits
- **Per-user message queue** — instead of rejecting messages while processing, queues them (up to `QUEUE_DEPTH`) and processes sequentially. Different users can process concurrently
- **Images bypass Claude's context** — photos are saved directly to the vault, with a temp copy passed via `--add-dir` so Claude can see and analyze the image without base64 bloating the prompt
- **Leveled logging** — `LOG_LEVEL` controls verbosity; `debug` streams Claude's stderr in real-time and logs spawn args, response previews, and exit codes. `LOG_FILE` optionally writes all output to a file for `tail -f` debugging

## Related

- [Obsidian MCP Server](https://github.com/jason-c-dev/obsidian-mcp) — the MCP server that gives Claude access to your vault
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — the CLI that powers the Claude invocations

## License

MIT
