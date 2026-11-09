# AGENTS.md — ZiweiHub (Ziwei Doushu P2)

<!--
  AGENTS: read this entire file before starting any task.
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

The upstream snapshot ships **without any backend**. **Our P2, ZiweiHub, turns it into a
full-stack app:** accounts, saved charts, AI readings with saved conversations, compatibility,
real-time practitioner consultations, an admin area, and a documented public API.
The chart and reading UI that already exists calls `/api/interpret` and `/api/heming`; keep
those contracts (section 2.3) and build around them.

### Tech stack and versions

| Area | Choice | Notes |
|---|---|---|
| Framework | Next.js 16, App Router | Routes live in `app/`. API routes go in `app/api/<name>/route.ts`. |
| UI | React 19, Tailwind CSS 3, framer-motion 11 | Client components start with `'use client';`. |
| Language | TypeScript 5, `strict: true` | Import with the `@/` alias (`@/lib/ziwei/types`). |
| Charting engine | `iztro`, `lunar-javascript`, our `lib/ziwei/` | Entry point: `generateChart(info)` in `lib/ziwei/algorithm.ts`. |
| AI | `@anthropic-ai/sdk` | Server-side only. Key in `ANTHROPIC_API_KEY`. Model in `ANTHROPIC_MODEL`. |
| Database | PostgreSQL 16 + Prisma | Schema in `prisma/schema.prisma`. One shared client in `lib/db.ts`. Change the schema only with a migration (`npx prisma migrate dev --name <name>`). |
| Auth | Auth.js (NextAuth v5), JWT sessions | GitHub OAuth. Config in `auth.ts`. Read the session with `auth()` on the server. |
| Validation | `zod` | Every request body, query, and env variable is parsed with a zod schema. |
| Unit / integration tests | Vitest | New app code. See "Testing strategy". |
| E2E tests | Playwright | `e2e/*.spec.ts`, Chromium in CI. |
| API docs | OpenAPI 3.1 + Swagger UI | Spec in `docs/openapi.yaml`, served at `/api-docs`. |
| Hosting | Vercel + Neon Postgres | Vercel Git integration: preview per PR, production from `main`. Neon integration: a database branch per preview. Migrations run in the build (`prisma migrate deploy`). |
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
lib/auth/            ← NEW. Role checks: requireUser(), requireRole('admin'), canViewChart()
lib/db.ts            ← NEW. The only PrismaClient instance
lib/validation/      ← NEW. zod schemas shared by routes and forms
lib/classics/        Public-domain classical texts
prisma/              ← NEW. schema.prisma + migrations/
app/api/v1/          ← NEW. Public API (API key + rate limit), documented in docs/openapi.yaml
app/(app)/           ← NEW. Logged-in pages: /charts, /consultations, /admin
tests/unit/          ← NEW. Vitest unit tests (*.test.ts)
tests/integration/   ← NEW. Vitest tests against a real Postgres test database
e2e/                 ← NEW. Playwright specs
scripts/regression/  Charting-engine regression tests (*.test.ts), run with tsx
docs/                Data and documentation; docs/tianji-ziwei/ is NON-COMMERCIAL licensed
```

Key patterns:
- **The engine is pure.** `lib/ziwei/*` takes plain data and returns plain data. No network, no React state, no `Date.now()` inside chart logic.
- **AI code stays on the server.** Anything that touches `@anthropic-ai/sdk` or an API key lives in `app/api/` or `lib/ai/` and is never imported by a `'use client'` file.
- **The frontend contract is fixed.** See section 2.3. Build the backend to match it.
- **Route files export only route fields.** `app/api/**/route.ts` may export only HTTP handlers (`POST`, `GET`) and route config (`runtime`). Extra exports make the route the place where logic lives, which is what we want to avoid. Put helpers, prompt building, and anything a test needs to import in `lib/ai/`.
- **Every protected route checks auth first.** Call `requireUser()` or `requireRole()` from `lib/auth/` before reading any data, and check ownership (`canViewChart()`) before returning a chart. Never trust a user id sent by the client.
- **Database access goes through `lib/db.ts`.** Don't create another `PrismaClient`.
- **Keep the route thin.** The route parses the request, calls `lib/ai/` functions, and returns the response. Validation, chart-to-text, and the stream encoder each live in `lib/ai/` and have their own tests.

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

<!-- v3: the engine keeps its tsx tests; new app code uses Vitest + Playwright. -->

We use **TDD (red → green → refactor)**, and the git history must show it:
1. **Red:** write the failing test first and commit it alone: `test(<scope>): <behavior> (#<issue>)`.
2. **Green:** write the smallest code that passes, commit: `feat(<scope>): ... (#<issue>)`.
3. **Refactor:** clean up with tests still green, commit: `refactor(<scope>): ... (#<issue>)`.
When asked to implement an issue, **stop after step 1** and show the failing test output before writing the implementation.

| Layer | Tool | Location | What it covers |
|---|---|---|---|
| Engine regression | `tsx` + repo `ok()` helper | `scripts/regression/*.test.ts` | Chart calculation. Unchanged from upstream; register new files in the `test` script. |
| Unit | Vitest | `tests/unit/**/*.test.ts` | Pure functions in `lib/` (validation, serializer, scoring, role checks). No network, no DB. |
| Integration | Vitest + Postgres test DB | `tests/integration/**/*.test.ts` | API route handlers with a real database. Mock only the Anthropic client. |
| E2E | Playwright | `e2e/*.spec.ts` | One spec per user story's main flow, in the browser. |

- Engine tests keep the `ok()` pattern (no `node:assert`). New tests use Vitest's `describe` / `it` / `expect`.
- Integration tests reset the DB between files (`prisma migrate reset --force` on `DATABASE_URL_TEST`) and never touch the dev or production DB.
- Never call the real Anthropic API in any test.
- **Coverage goal:** 80% lines for `lib/` (`vitest --coverage`), every acceptance criterion covered by a test or a written manual step in the PR, and every user story has an E2E spec.
- **Commands:** `npm run typecheck`, `npm test` (engine), `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`. All must pass locally and in CI.

### Roles and authorization

| Role | Can do |
|---|---|
| Guest | Build a chart in the browser; read the public API docs. Nothing is saved. |
| Member | Save/rename/delete own charts, AI readings and saved conversations, compatibility between own charts, share a chart with a practitioner, report a reading. |
| Practitioner | Everything a member can, plus: see charts shared with them, add palace notes, reply in consultation threads. |
| Admin | Manage users and roles, review reports, set daily AI limits, revoke API keys. |

A user only ever sees their own charts and charts explicitly shared with them. Check this on the server in every route.

## 2. PRD & Design References

### 2.1 Documents

- PRD: `docs/PRD.md` (description, user stories, release scope). Acceptance criteria for each story live in its GitHub Issue.
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
- **TDD commits:** a `test(...)` commit with the failing test comes before the `feat(...)` commit for the same issue (see "Testing strategy").
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
- Validate every API request body before using it: `chart.palaces` must have 12 entries, at most **30 messages**, each at most **2,000 characters**, roles only `user` / `assistant` (limits from issue #5).
- Stream responses; the UI is built for streaming.
- Write the failing test first (TDD), and add a test for each new `lib/` function.

### Don't
- **Don't add Jest, Mocha, or any other test framework.** Use tsx for engine tests, Vitest for unit/integration, Playwright for E2E.
- **Don't change chart-calculation results** in `lib/ziwei/` unless the issue says so, and then only with a cited source and a regression test.
- Don't change the request/response shapes in section 2.3.
- Don't add new dependencies without saying why in the PR. Prefer what is installed or listed in the stack table: `@anthropic-ai/sdk` for AI, Prisma for the database, Auth.js for login, zod for validation, `ioredis` for rate limiting, `clsx` for class names, framer-motion for animation.
- Don't add another UI or CSS library, or inline new color values.
- **Don't delete or rewrite existing content outside the issue's scope.** When adding variables to `.env.example`, add them and keep every existing entry and comment. Don't edit README unless the issue asks for docs.
- Don't hardcode a dated model ID (like `claude-3-5-sonnet-20241022`). Read the model from `ANTHROPIC_MODEL`, and if it's missing, return 500 with `{ error }`.
- Don't use the `docs/tianji-ziwei/` quotes in anything commercial (they are CC BY-NC-SA).

### Security
- Validate every input with zod. Return 400 with `{ error }` on failure, 401 if not logged in, 403 if logged in but not allowed, 404 if the record isn't theirs (don't reveal it exists).
- Birth data (`birthInfo`) is stored encrypted at rest (`lib/crypto.ts`, key in `DATA_ENCRYPTION_KEY`).
- Public API keys are stored hashed, never in plain text. Rate-limit `/api/v1/*` and AI routes per key / per user.
- API keys only in `.env.local` (git-ignored). Add any new variable to `.env.example` with a fake value.
- Never import server code or read `process.env` secrets in a `'use client'` file. Only `NEXT_PUBLIC_*` variables may reach the browser.
- **Birth data is personal data.** Don't log full birth details or chat contents on the server, don't put real people's birth data in tests or issues, and don't send more of the chart to the AI than the reading needs.
  - **Never send `birthInfo` or `lunarInfo` (birth date, hour, gender) to the AI.** Send only what a reading uses: the 12 palaces (name, branch, stars, brightness, 四化), `wuxingJuName`, `mingZhu`, `shenZhu`, `currentAge`, and the decade ranges.
  - Never `JSON.stringify` the whole chart into a prompt. Build the text with a serializer in `lib/ai/`.
- Limit request size and rate-limit AI routes so one user can't run up the API bill.

### Accessibility
- Every input has a visible `<label>`. Buttons are real `<button type="button">` elements.
- Interactive elements work with the keyboard (Tab, Enter, Esc) and show a focus outline.
- Streaming text sits in a container with `aria-live="polite"` so screen readers announce it.
- Text keeps a contrast ratio of at least 4.5:1 against the dark background.
- Information isn't shown by color alone (for example, the 四化 markers also carry their character label).

## 5. Definition of Done

A task is done when: the acceptance criteria are all met, `npm run typecheck` and `npm test` pass, new code has tests, the PR links the issue, and a teammate approved it.

**When you finish a task, end your reply with:**
1. Each acceptance criterion from the issue, marked ✅ or ❌.
2. The branch name (section 3 format).
3. The commit message (section 3 format).
4. The PR description line `Closes #<issue>`.

## Changelog
<!-- Record each change to this file and why. This is the evidence of iteration for HW3. -->
- v1 (10/30/2026): first version.
- v3.1 (11/08/2026): re-planned for the Nov 12 deadline: GitHub OAuth only; Vercel and Neon integrations handle previews, production, and per-preview databases.
- v3 (11/01/2026): P2 approved as ZiweiHub. Added database, auth, roles, public API, and hosting to the stack; added the roles table and auth rules; replaced the tsx-only test rule with a layered strategy (engine tests stay on tsx, new code uses Vitest and Playwright) because P2 requires unit, integration, and E2E tests; added TDD commit order. PRD now points to docs/PRD.md.
- v2 (10/31/2026): after the first with-rules test run on issue #4. The agent ignored several rules, so v2 makes them concrete and checkable:
  - Route files may export only route fields (the agent exported a test helper from `route.ts`). Note: we first believed this breaks `next build`, but we tested it and the build passed on Next 16, so the rule is kept as an architecture convention, not a build requirement.
  - Keep the route thin; logic goes in `lib/ai/` (the agent put everything in `route.ts`).
  - Exact privacy rule: never send `birthInfo`/`lunarInfo`; never stringify the whole chart (the agent sent the full chart JSON).
  - Exact validation limits from issue #5 (the agent had no limits).
  - Test snippet and "no `node:assert`" (both runs used `node:assert`).
  - Don't delete existing `.env.example` entries; no hardcoded dated model ID (both runs did this).
  - Required end-of-task summary with acceptance criteria, branch, commit, and `Closes #N`.
