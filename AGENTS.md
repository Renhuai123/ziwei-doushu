# AGENTS.md — Ziwei Doushu P2

<!--
  Rules file for AI coding agents (Antigravity, Claude Code, Cursor, Copilot).
  Agents read this file before every task. Keep it short enough to read in full,
  and specific enough that an agent can follow it without asking.
  Owners: Yikang Liu, Yizhang Cao. Update it whenever a rule changes (see "Changelog" at the end).
-->

## 1. Project Context

<!-- What the project is, so the agent does not have to guess from the code. -->

This repo is our fork of the open-source Zi Wei Dou Shu (紫微斗数) charting engine
(upstream: https://github.com/Renhuai123/ziwei-doushu, MIT). The engine turns a birth
date, birth hour, and gender into a 12-palace astrology chart, entirely in the browser.

The upstream snapshot ships **without any backend**: `/api/interpret` (AI chart reading)
and `/api/heming` (two-person compatibility) return 404 on purpose. **Our P2 builds those
missing pieces.** The frontend that calls them already exists; do not rewrite it.

### Tech stack and versions

| Area | Choice | Notes |
|---|---|---|
| Framework | Next.js 16, App Router | Routes live in `app/`. API routes go in `app/api/<name>/route.ts`. |
| UI | React 19, Tailwind CSS 3, framer-motion 11 | Client components start with `'use client';`. |
| Language | TypeScript 5, `strict: true` | Import with the `@/` alias (`@/lib/ziwei/types`). |
| Charting engine | `iztro`, `lunar-javascript`, our `lib/ziwei/` | Entry point: `generateChart(info)` in `lib/ziwei/algorithm.ts`. |
| AI | `@anthropic-ai/sdk` | Server-side only. Key in `ANTHROPIC_API_KEY`. Model in `ANTHROPIC_MODEL`. |
| Runtime | Node 22 (same as CI) | Install with `npm ci`, never `npm install` in CI. |

### Architecture

```
app/                 Next.js routes (pages + our new app/api/* routes)
  chart/page.tsx     Chart demo: BirthForm → generateChart() → ChartBoard + InsightPanel
  heming/page.tsx    Compatibility page; calls POST /api/heming
  api/               ← NEW in P2. One folder per route, file named route.ts
components/          React UI. One component per file, PascalCase.tsx
  ChatPanel.tsx      Chat UI; streams from POST /api/interpret
  InsightPanel.tsx   Reading panel; also streams from POST /api/interpret
lib/ziwei/           Charting engine (pure functions, no React except history.ts)
lib/ai/              ← NEW in P2. Prompt building, chart-to-text, Anthropic client
lib/classics/        Public-domain classical texts
scripts/regression/  Tests (*.test.ts), run with tsx
docs/                Data and documentation; docs/tianji-ziwei/ is NON-COMMERCIAL licensed
```

Key patterns:
- **The engine is pure.** `lib/ziwei/*` takes plain data and returns plain data. No network, no React state, no `Date.now()` inside chart logic.
- **AI code stays on the server.** Anything that touches `@anthropic-ai/sdk` or an API key lives in `app/api/` or `lib/ai/` and is never imported by a `'use client'` file.
- **The frontend contract is fixed.** See section 2.3. Build the backend to match it.

### Naming conventions and coding standards

- Components: `PascalCase.tsx`, default export (`export default function ChartBoard`).
- Library files: `kebab-case.ts` (`true-solar-time.ts`), named exports.
- Types and interfaces: `PascalCase` in `types.ts` files (`ZiweiChart`, `BirthInfo`, `Palace`).
- Functions and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE` (`STORAGE_KEY`).
- Domain terms keep their pinyin or Chinese names (`sihua`, `daxian`, `liunian`, `heming`). Do not translate them into invented English names.
- Comments: Chinese or English are both fine; match the file you are editing. Explain *why*, not *what*.
- No `any`. Use the types in `lib/ziwei/types.ts`, or define a new one.
- Run `npm run typecheck` before saying a task is done.

### Testing strategy

<!-- The repo does NOT use Jest or Vitest. Agents tend to add them; that is the #1 mistake to prevent. -->

- **Framework:** none. Tests are plain TypeScript files run with `tsx`, using the repo's own assert helpers (`ok()` / `fail()` that count failures and `process.exit(1)` on failure). Copy the pattern in `scripts/regression/pan-integrity.test.ts`.
- **Location and naming:** `scripts/regression/<kebab-name>.test.ts`.
- **Registration:** every new test file must be added to the `test` script in `package.json`, or CI will not run it.
- **What to test:**
  - Any change to chart results: a regression test with the source of the expected result in a comment.
  - Every new `lib/ai/` function: inputs → expected output (for example, the chart-to-text serializer).
  - API routes: test the request validation and the stream format with the Anthropic client mocked. Never call the real API in tests.
- **Coverage goal:** every new `lib/` function has at least one test, and every acceptance criterion in the GitHub Issue is checked by a test or a written manual step in the PR.
- **Commands:** `npm run typecheck` and `npm test`. Both must pass locally and in CI.

## 2. PRD & Design References

### 2.1 Documents

- PRD: the user stories and acceptance criteria live in the GitHub Issues on our board (one issue per story).
  <!-- TODO: replace with a link to the full PRD document once it is in the repo (e.g. docs/PRD.md). -->
- Prototype: the running app itself. `/chart` (chart + AI reading) and `/heming` (compatibility) are the screens P2 builds on.
  <!-- TODO: add a Figma or Claude artifact link here if we make a separate mockup. -->
- Backlog: GitHub Project board "Ziwei P2 Sprint Board". Every task starts from an Issue there.

### 2.2 Mockups and key UI components

<!-- Describe the screens in words so the agent understands intent even without opening the mockup. -->

- **Birth form (`BirthForm`)**: date, clock time, birthplace (province/city → longitude), gender. Submitting builds the chart. Clock time is converted to an **hour branch index 0–11** (子=0 … 亥=11); never pass a clock hour to the engine.
- **Chart board (`ChartBoard`, `PalaceCell`)**: 4×4 grid of the 12 palaces around a center summary. Clicking a palace selects it and updates the reading panel.
- **Time navigation (`TimeNav`)**: switches between natal (本命), decade (大限), and annual (流年) views.
- **Reading panel (`InsightPanel`)** and **chat (`ChatPanel`)**: stream an AI reading for the current chart, text appearing as it arrives, with a loading state and a readable error message.
- **Visual style**: dark, gold-accented "glass card" look. Use the existing CSS variables (`var(--t-gold)`, `var(--t-border)`, `var(--t-faint)`) and the `card-glass` class. Do not add new colors or a new UI library.

### 2.3 Fixed API contract (build the backend to this)

The frontend already calls these endpoints. **Do not change the frontend to fit a different backend.**

`POST /api/interpret`
- Request JSON: `{ chart: ZiweiChart, messages: { role: 'user' | 'assistant', content: string }[] }`
- Response: `text/event-stream`. Each chunk is a line `data: {"delta":{"text":"..."}}`, and the stream ends with `data: [DONE]`.
- Errors: 400 for an invalid body, 500 with a short JSON `{ error }` for server failures. Never 404 (the UI shows 404 as "API not implemented").

`POST /api/heming`
- Request JSON: `{ chartA: ZiweiChart, chartB: ZiweiChart, question?: string }`
- Response: the same stream format as `/api/interpret`.

### 2.4 User flows the agent should follow

1. **Chart + reading:** user fills `BirthForm` → `generateChart()` runs in the browser → chart renders → user opens the reading → `InsightPanel` posts to `/api/interpret` → text streams in.
2. **Follow-up question:** user types in `ChatPanel` → the full message history plus the chart is posted → answer streams in below the history.
3. **Compatibility:** user enters two people on `/heming` → both charts build in the browser → page posts to `/api/heming` → analysis streams in.

When a feature changes one of these flows, update this section in the same PR.

## 3. Scrum & Workflow

- **Every change starts from a GitHub Issue.** If there is no issue, ask for one instead of starting work.
- **Branch names:** `<type>/<issue-number>-<short-kebab-description>`
  - Types: `feature`, `fix`, `chore`, `docs`, `test`
  - Example: `feature/12-interpret-api-route`
- **Commit messages:** Conventional Commits, with the issue number at the end.
  - Format: `<type>(<scope>): <summary in imperative mood> (#<issue>)`
  - Example: `feat(api): stream chart reading from /api/interpret (#12)`
  - Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`. Keep the summary under 72 characters.
- **Pull requests:**
  - One PR = one issue. Put `Closes #<issue>` in the description so the issue closes on merge.
  - Fill in the existing `.github/PULL_REQUEST_TEMPLATE.md` checklist.
  - Paste the issue's acceptance criteria and tick each one off.
  - At least **one teammate review** before merging. CI (typecheck + tests) must be green.
  - Move the issue card: In Progress → In Review when the PR opens, → Done when merged.
- **Referencing issues in code:** only for workarounds or known limits, as `// See #<issue>: <reason>`. Don't litter code with issue numbers.

## 4. Do's and Don'ts

### Do
- Read the GitHub Issue and its acceptance criteria before writing code, and restate them in your plan.
- Reuse existing types and helpers (`ZiweiChart`, `generateChart`, `formToBirthInfo`) before writing new ones.
- Keep changes small and focused on the issue.
- Validate every API request body (shape, types, max message count and length) before using it.
- Stream responses; the UI is built for streaming.
- Add a test for each new `lib/` function and register it in `package.json`.

### Don't
- **Don't add Jest, Vitest, or any test framework.** Use the tsx pattern above.
- **Don't change chart-calculation results** in `lib/ziwei/` unless the issue says so, and then only with a cited source and a regression test.
- Don't change the request/response shapes in section 2.3.
- Don't add new dependencies without saying why in the PR. Prefer what is installed: `@anthropic-ai/sdk` for AI, `ioredis` for rate limiting, `clsx` for class names, framer-motion for animation.
- Don't add another UI or CSS library, or inline new color values.
- Don't use the `docs/tianji-ziwei/` quotes in anything commercial (they are CC BY-NC-SA).

### Security
- API keys only in `.env.local` (git-ignored). Add any new variable to `.env.example` with a fake value.
- Never import server code or read `process.env` secrets in a `'use client'` file. Only `NEXT_PUBLIC_*` variables may reach the browser.
- **Birth data is personal data.** Don't log full birth details or chat contents on the server, don't put real people's birth data in tests or issues, and don't send more of the chart to the AI than the reading needs.
- Limit request size and rate-limit AI routes so one user can't run up the API bill.

### Accessibility
- Every input has a visible `<label>`. Buttons are real `<button type="button">` elements.
- Interactive elements work with the keyboard (Tab, Enter, Esc) and show a focus outline.
- Streaming text sits in a container with `aria-live="polite"` so screen readers announce it.
- Text keeps a contrast ratio of at least 4.5:1 against the dark background.
- Information isn't shown by color alone (for example, the 四化 markers also carry their character label).

## 5. Definition of Done

A task is done when: the acceptance criteria are all met, `npm run typecheck` and `npm test` pass, new code has tests, the PR links the issue, and a teammate approved it.

## Changelog
<!-- Record each change to this file and why. This is the evidence of iteration for HW3. -->
- v1 (10/30/2026): first version.
