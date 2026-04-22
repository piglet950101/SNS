# Postari (ポスタリ)

SNS auto-posting SaaS for solo-operator Japanese shops — concept cafes, maid cafes, small restaurants, bars.

> **"Take a photo of today's menu, tap once, and post it to X with AI-generated Japanese copy that follows 景品表示法 compliance."**

- Service: **Postari** — https://postari.jp
- Operating entity: **株式会社アテナ**
- Support: support@postari.jp

## Phase 1 scope

X (Twitter) only. AI-generated post text + automated X posting + 3-generation free trial with paywall + billing. Phases 2-4 (Google Business Profile / WordPress / Instagram) are **NOT** in scope.

## Stack

- Node 20 LTS · TypeScript 5.4 · pnpm 9 · Turborepo
- Next.js 14 (App Router) · Tailwind · shadcn/ui
- Express · Drizzle · Zod · BullMQ
- PostgreSQL 16 · Valkey (Redis-compatible)
- Cloudflare R2 · Clerk · Stripe · Anthropic Claude Sonnet 4.5
- Hosted on Render · observability via Sentry

## Repo layout

```
apps/
  web/              # Next.js 14 — all 15 Phase 1 screens
  api/              # Express — REST API + webhooks
  worker/           # BullMQ consumer + crons
packages/
  db/               # Drizzle schema + migrations
  shared/           # Shared types, constants, zod schemas
  prompts/          # Claude prompt templates + 景表法 guardrails
infrastructure/
  render.yaml       # Render Blueprint
  docker-compose.yml  # Local dev (Postgres + Valkey)
```

## Quick start (local dev)

```bash
# Prereqs: Node 20, pnpm 9, Docker
nvm use
pnpm install

# Boot Postgres + Valkey
docker compose -f infrastructure/docker-compose.yml up -d

# Bootstrap schema
cp .env.example .env      # fill in secrets
pnpm db:generate
pnpm db:migrate

# Run everything
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

## Environment

See [.env.example](./.env.example) for the full variable list. In production all secrets live in **Render Secret Files** — never commit real values.

## Commands

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `pnpm dev`            | Run all apps in watch mode                    |
| `pnpm build`          | Build all apps + packages                     |
| `pnpm typecheck`      | TS across the workspace                       |
| `pnpm lint`           | ESLint                                        |
| `pnpm test`           | Vitest                                        |
| `pnpm db:generate`    | Generate Drizzle migration from schema change |
| `pnpm db:migrate`     | Apply pending migrations                      |

## Legal

Three legal documents are served at build-time from `apps/web/app/(marketing)/legal/*` and linked from the footer of every public page:

- `/legal/tokushoho` — 特定商取引法に基づく表記
- `/legal/privacy` — プライバシーポリシー
- `/legal/terms` — 利用規約

Source PDFs live in `/new/` in the spec repo (not this one) and were converted to HTML at setup time.

## Handoff

See the spec repo (`e:\work\SNS\`) for `PHASE1_IMPLEMENTATION_GUIDE.md` and `HANDOFF.md`. Those are the source of truth for scope and sequencing.
