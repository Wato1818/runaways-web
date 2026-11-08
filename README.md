# Nuxt Template

A batteries-included Nuxt starter with authentication, PostgreSQL, Drizzle ORM, Una UI, and form validation.

## Features

- Nuxt 4 with TypeScript
- UnoCSS + Una UI (icons, attributify, animations, web fonts)
- Username/password authentication via `nuxt-auth-utils`
- Login, registration, logout, and protected routes
- PostgreSQL + Drizzle ORM with migrations
- vee-validate + zod form validation
- ESLint via `@antfu/eslint-config`

## Requirements

- Node.js 22+
- pnpm 11+
- Docker (optional, for the local database)

## Setup

```bash
pnpm install
cp .env.example .env
```

Set `NUXT_SESSION_PASSWORD` to a random string of at least 32 characters.

## Database

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Push the schema and (optionally) create an admin user:

```bash
pnpm db:push
pnpm exec nuxi task run seedAdmin
```

## Development

```bash
pnpm dev
```

Visit http://localhost:3000, then register at `/register` or sign in at `/login`.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with fixes |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:push` | Push the schema to the database |
| `pnpm db:studio` | Open Drizzle Studio |

## Authentication

The auth flow lives in a few small files so it is easy to adapt:

- `shared/schemas/auth.ts` — login and registration validation
- `server/api/login.post.ts`, `server/api/signup.post.ts`, `server/api/logout.post.ts`
- `server/db/schema.ts` — the `users` table
- `app/pages/login.vue`, `app/pages/register.vue`
- `app/middleware/authenticated.ts`, `app/middleware/isAdmin.ts`

To switch from username to email, update the schema, `shared/schemas/auth.ts`, and the two forms.

## Environment

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NUXT_SESSION_PASSWORD` | Session encryption secret (32+ characters) |
| `ADMIN_PASSWORD` | Password used by the admin seed task |
