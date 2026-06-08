# Sliding

Self-hosted executive presentations. Engineers prepare research (markdown), AI generates structured slides, executives view via shareable phone links.

## Stack

- **Frontend**: TanStack Start (SSR) + React 19
- **Runtime**: Bun
- **Database**: Supabase PostgreSQL + pgvector
- **Auth**: JWT (Better-Auth style)
- **AI**: OpenAI gpt-4o (primary) + Claude Sonnet (fallback)
- **Styling**: Tailwind CSS v4 (mobile-first, 375px target)

## Getting Started

```bash
bun install
cp .env.example .env  # then set your env vars
bun run dev
```

## Database

```bash
supabase db push  # applies supabase/migrations/001_initial_schema.sql
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/sign-in` | Sign in |
| `/auth/sign-up` | Create account (first user creates tenant) |
| `/app` | Engineering dashboard |
| `/p/:token` | Executive view (public, mobile-first) |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/sign-in` | Sign in |
| `POST` | `/api/auth/sign-up` | Sign up + create tenant |
| `GET` | `/api/auth/me` | Current user session |
| `POST` | `/api/presentations` | Create presentation (triggers AI) |
| `GET` | `/api/presentations` | List presentations |
| `GET` | `/api/presentations/:id` | Get presentation |
| `POST` | `/api/presentations/:id/regenerate` | Regenerate with feedback |
| `GET` | `/api/presentations/t/:token` | Get shared presentation (public) |
| `POST` | `/api/presentations/:id/revoke` | Revoke access |

## Test

```bash
bun run test
```

## 7 Slide Types

title (cover) | problem | solution | evidence (ranked bullets) | comparison (table) | next_steps | conclusion (CTA)
