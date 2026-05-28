# Idle Friends RPG

A mobile-first idle loot RPG for a private group of 5 players.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Prepare a local PostgreSQL database first.

Recommended defaults for this repo:

- database user: `root`
- database name: `Ninjala`

Then update `.env` so `DATABASE_URL` points to that database.

4. Run the database migration:

```bash
npm run db:migrate
```

5. Seed the invite codes:

```bash
npm run db:seed
```

6. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default Invite Codes

- `PENGUIN-LI`
- `PENGUIN-HU`
- `PENGUIN-ZHAO`
- `PENGUIN-ZHOU`
- `PENGUIN-GUEST`

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run test` - run unit tests
- `npm run sim:idle` - inspect idle output by region
- `npm run sim:drops` - inspect rarity distribution by drop table
- `npm run sim:players` - simulate a 5-player cohort over multiple day counts
- `npm run sim:economy` - run the closed-test economy sweep and warnings
- `npm run db:migrate` - create/apply Prisma migration
- `npm run db:clear-accounts` - clear all registered users and player progress while keeping invite codes
- `npm run db:seed` - seed invite codes
- `npm run db:studio` - open Prisma Studio

## Current Status

The playable V1 core loop is already in place:

- account-password login, one-time invite registration, and session persistence
- idle region switching and offline reward claims
- gold, exp, material, and equipment rewards
- formula-based leveling from total exp, using the nonlinear curve with a theoretical cap of level 3000
- inventory, gear equip, dual accessory slots, one-click best equip, and power recalculation
- bosses, region unlock progression, rankings, and logs
- enhancement, dismantling, material crafting, targeted forging, and affix reforging
- goldBonus, expBonus, dropBonus, crit, and luck now all feed real reward or combat outcomes instead of being display-only
- gear detail cards now explain base item, affixes, source region, and which stat lines come from base stats vs affixes
- optional AI idle flavor logs with safe fallback when `OPENAI_API_KEY` is missing or fails
- shared world boss flow and once-per-day friend blessings
- Chinese-first UI with a global `ZH / EN` toggle
- tabbed mobile UX for boss and inventory flows, with a paged grid backpack instead of one long gear list
- logs, rankings, and character gear now also use compact tabbed layouts and pagination to avoid long mobile scrolling
- home and idle now use the same compact tabbed layout language as the rest of the core flow
- same-page tab, pagination, action refreshes, and modal close actions now preserve scroll position without the old top-jump or scroll jitter
- a test-only `/admin` console now handles player resets, resource grants, full progress resets, and account cleanup, but only for the account registered from `PENGUIN-LI`

Authentication rules:

- registration requires `invite code + username + password + nickname`
- each invite code can create only one account
- later logins only need username and password

Current hardening priorities:

- manual day-one mobile smoke pass before inviting friends
- closed-test feedback on whether current progression pacing feels too slow or too fast

## Implemented Routes

- `/home` - overview, route shortcuts, and project-status tabs
- `/admin` - test-only console for resets, resource grants, and account cleanup
- `/idle` - overview, region switching, and material stash tabs
- `/inventory` - paged grid backpack plus enhancement, crafting, forging, reforging, dismantling tabs
- `/characters` - separate stats and gear tabs with a slot-selection equipment panel, including two accessory positions
- `/boss` - separate main-boss and world-boss tabs with corrected result feedback
- `/rankings` - separate ladder and blessing tabs with paged friend lists
- `/logs` - paged timeline and reward views for personal and global activity logs

## Optional AI Setup

The game does not require AI to function.

- Leave `OPENAI_API_KEY` empty to keep deterministic fallback idle logs
- Set `OPENAI_API_KEY` to enable best-effort AI flavor text for idle claim logs
- `OPENAI_IDLE_LOG_MODEL` can override the default model used for idle flavor generation

## Documentation

Project docs live in `docs/`.

Recommended entry point:

- `docs/README_INDEX.md`
- `docs/CLOSED_TEST_PLAN.md` for Phase 8 commands and findings
- `docs/DEPLOYMENT_RUNBOOK.md` for the Chinese final deployment runbook
- `docs/HERMES_ONE_SHOT_DEPLOY.md` for the Hermes one-shot deployment prompt
- `docs/LAUNCH_CHECKLIST.md` for pre-invite go/no-go checks

If you plan to self-host on a lightweight server, `docs/DEPLOYMENT_RUNBOOK.md` now includes a Chinese copy-paste deployment flow for `Ubuntu 24.04 + www.ninjala.online + local Postgres + PM2 + Nginx`.
