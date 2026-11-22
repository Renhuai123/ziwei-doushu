# Local Development Setup

> **Important:** This project is configured for **local / personal use only**. The AI interpretation feature uses your locally-installed CLI tools (`claude` or `codex`) under your own subscription — **do not configure paid commercial API keys** (`ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, etc.) unless you explicitly intend to pay per-request. The default `.env.local` is intentionally set to `AI_PROVIDER=claude-code` (local CLI) and `AI_FALLBACK=codex` (local CLI) for this reason.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | `node --version` |
| npm | ≥ 10 | Bundled with Node 20 |
| Git | any | For cloning |
| Claude CLI (`claude`) | latest | For AI interpretation — local, uses your subscription |
| Docker + docker compose | any | Optional — only if you want Langfuse tracing (see below) |

Install Claude CLI if you haven't:

```bash
npm install -g @anthropic-ai/claude-code
claude --version   # confirm it works and you're logged in
```

---

## 1. Clone and Install

```bash
git clone https://github.com/Renhuai123/ziwei-doushu.git
cd ziwei-doushu
npm install
```

---

## 2. Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local`. The defaults already work for a local setup — the only required edit is:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

That line is already set. You can run the app immediately without touching anything else **if you only want charting (no AI interpretation)**.

### AI Interpretation (optional)

The app supports four AI providers. **For local/personal use, pick one of the first two — they use your existing CLI subscription, not a paid API key:**

| Provider | How it works | Setup |
|----------|-------------|-------|
| `claude-code` **(recommended)** | Calls the `claude` CLI you installed in Prerequisites | Make sure `claude` is in your `$PATH` and you're logged in (`claude --version`) |
| `codex` | Calls the `codex` CLI | Install and log in: `npm install -g @openai/codex` |
| `zai` | Z.ai GLM API (pays per token) | Set `ZAI_API_KEY=` in `.env.local` |
| `anthropic` | Anthropic Claude API (pays per token) | Set `ANTHROPIC_API_KEY=` in `.env.local` |

> **Do not set `ANTHROPIC_API_KEY` or any other commercial key** unless you intend to pay for requests. The `claude-code` provider uses your subscription (zero extra cost).

Default configuration in `.env.local`:

```env
AI_PROVIDER=claude-code
AI_FALLBACK=codex
# CLAUDE_CODE_BIN=claude        # override if claude is not in $PATH
# CLAUDE_CODE_MODEL=            # leave blank for default model
# CODEX_BIN=codex
# CODEX_MODEL=
```

Leave the commercial key lines commented out or empty:

```env
ZAI_API_KEY=          # leave blank
ANTHROPIC_API_KEY=    # leave blank
```

---

## 3. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The charting engine runs entirely in the browser — no backend, no API keys needed. AI interpretation calls go through `/api/interpret`, which spawns your local `claude` CLI.

---

## 4. Verify Everything Works

```bash
# TypeScript type checking
npm run typecheck

# Regression tests (768 chart combinations × natal integrity, DST, solar boundaries, etc.)
npm test
```

Both should pass with no errors before you start making changes.

---

## 5. Tracing (optional)

The app writes AI request traces to `data/traces/YYYY-MM-DD.jsonl` automatically. If you also want a local Langfuse dashboard:

```bash
# Requires Docker to be running
bash scripts/langfuse-setup.sh
```

This generates secrets in `infra/langfuse/.env` (never committed), starts Langfuse on port 3100, and appends the keys to `.env.local`. Open [http://localhost:3100](http://localhost:3100) with the printed credentials.

To stop Langfuse (data is preserved in the Docker volume):

```bash
docker compose -f infra/langfuse/docker-compose.yml down
```

To disable file tracing entirely, add to `.env.local`:

```env
TRACE_FILE=0
```

---

## 6. What's Not Included

The open-source repo contains the charting engine and a demo UI. These are **not** included:

- The commercial interpretation copy (`lib/ziwei/db-analysis.ts` is a placeholder)
- AI interpretation prompts
- Backend API routes (`/api/interpret`, `/api/heming`) — if missing, the UI shows "open-source version does not include this endpoint"
- User accounts, payments, rate limiting, watermarking

---

## 7. Useful Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run typecheck` | Full TypeScript check (no emit) |
| `npm test` | Run all regression tests |

---

## Troubleshooting

**`claude: command not found`**
Install the Claude CLI: `npm install -g @anthropic-ai/claude-code`, then log in.

**AI interpretation returns "open-source version does not include this endpoint"**
The `/api/interpret` route is not in this repo. This is expected — see Section 6.

**Port 3000 already in use**
Next.js will auto-pick the next free port and print it. Or kill the occupant: `lsof -ti:3000 | xargs kill`.

**`npm test` fails on a date-related assertion**
Make sure your system clock is correct. Some boundary tests depend on the current year.

**Langfuse setup script fails**
Check that Docker Desktop / OrbStack is running: `docker info`. The script prints a specific error if it isn't.
