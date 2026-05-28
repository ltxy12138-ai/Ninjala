# Deployment Runbook

## Goal

Ship the current Next.js + Prisma game to the public internet so a small friend group can actually play together.

This document describes the recommended path, current blockers, and the concrete engineering changes required before launch.

## Current Online Blockers

### 1. SQLite Is Fine Locally but Not for Shared Public Play

- The current datasource is local SQLite.
- SQLite is convenient for local testing, but it is not the right choice for multiple public players hitting the same deployed app instance.
- A real online deployment should use a network-accessible database such as Postgres.

### 2. Session and Cookie Secrets Must Be Explicit in Production

- Login and session behavior cannot rely on ad hoc local defaults.
- Production must have a stable secret strategy and environment-variable checklist.

### 3. `/admin` Must Stay Restricted

- The current `/admin` page is intentionally test-oriented.
- Production must either fully disable it or keep the existing whitelist restriction and add an additional production guard.

### 4. Seed and Invite Bootstrap Need a Real Release Flow

- Invite codes currently come from a local seed script.
- Production launch needs an explicit “first batch of invites” workflow, not manual one-off commands after deployment.

## Recommended Route

### Primary Recommendation

Use:

- Vercel or another Next.js-friendly managed host
- Postgres-compatible managed database
- Prisma migrations in CI or release workflow

Why this is the best fit:

- Next.js App Router deploys cleanly on managed platforms
- the project is already structured as a web app, not a custom game server
- managed hosting removes a lot of operational burden for a 5-player private launch

### Backup Recommendation

Use:

- one cloud VM
- Node.js process manager
- reverse proxy
- Postgres-compatible managed database

This route is workable if you want full control, but it creates more ops work than the project currently needs.

## Required Engineering Changes

### 1. Move Prisma from SQLite to Postgres

Change the Prisma datasource from:

```prisma
provider = "sqlite"
```

to a Postgres-compatible provider.

Expected work:

- update `prisma/schema.prisma`
- create a fresh migration baseline for the target environment if needed
- remove or rewrite any SQLite-specific raw SQL such as `julianday(...)` before shipping to Neon/Postgres
- verify all indexes and text fields still behave as expected
- verify transaction-heavy flows:
  - idle claim
  - boss reward claim
  - world boss reward claim
  - blessing
  - equip / enhance / reforge

### 2. Production Environment Variables

At minimum, production should define:

- `DATABASE_URL`
- session/auth secret used by the app
- `OPENAI_API_KEY` only if AI idle flavor logs should be enabled
- `OPENAI_IDLE_LOG_MODEL` only if you want a non-default AI log model

Recommended practice:

- keep `.env.local` only for local development
- store production secrets in the host platform secret manager

### 3. Production Migration Flow

Before first public launch:

1. provision the production database
2. run Prisma migrations against production
3. run invite bootstrap / seed flow
4. verify at least one admin-approved account can log in

For later releases:

1. merge code
2. apply migration
3. deploy app
4. run smoke checks

### 4. Invite Strategy

Current product assumption:

- registration requires a one-time invite code
- each invite code can be used exactly once

Production release should prepare:

- first batch invite list
- owner/admin invite
- fallback backup invite list in case one code is consumed during testing

### 5. Admin Safety Strategy

Recommended production stance:

- default: disable `/admin` entirely in production

If you want to keep it:

- preserve the `PENGUIN-LI` account allowlist
- add a production-only environment gate
- do not expose “clear all accounts” to any broader audience

## Suggested Hosting Flow

### Option A: Managed Next.js + Managed Postgres

1. Create production database
2. Update Prisma datasource to Postgres
3. Configure production env vars in hosting platform
4. Deploy application
5. Run migrations
6. Seed invite codes
7. Perform smoke test with one real invite account

### Option B: Self-Hosted Node App

1. Provision VM
2. Install Node.js runtime
3. Configure reverse proxy and HTTPS
4. Provision managed Postgres
5. Upload code and install dependencies
6. Run Prisma migrations
7. Seed invite codes
8. Start the app with a process manager
9. Perform smoke test

## Smoke Test After Deployment

Run these before inviting friends:

1. Register a brand-new account with a fresh invite code
2. Log out and log back in with username + password
3. Claim one idle reward
4. Equip one item
5. Challenge one boss
6. Open rankings and logs
7. Confirm a second browser session sees shared state updates

## Recommended Next Engineering Task Before Real Launch

Do the database migration prep first:

- switch Prisma config to Postgres compatibility
- add production env docs
- add one explicit production bootstrap command sequence

Without that, the app is still “local-test ready” rather than “friend-launch ready.”
