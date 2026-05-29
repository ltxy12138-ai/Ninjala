# Tech Spec

## Goal

Define a small, maintainable technical foundation for a mobile-first idle RPG built with Next.js.

## Stack

### Application

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS

### Server and Data

- Next.js Route Handlers and Server Actions
- Prisma ORM
- PostgreSQL
- Prisma migrations shared by local and production environments

### Tooling

- Node.js LTS
- npm
- ESLint
- Prettier if later added by repo convention
- Vitest or Jest for unit tests
- lightweight balance scripts for economy sweeps and static reachability checks

### Deployment

- Vercel for app hosting
- Production database selected before public friend testing

## Architecture Principles

- App routes render UI and collect user input
- Business logic lives in `lib/game`
- Data access lives in server-side modules
- Static content and balance tables live in `data`
- AI helpers live in `lib/ai`
- Tests cover every core gameplay module

## Proposed Directory Structure

```text
app/
  layout.tsx
  page.tsx
  login/page.tsx
  home/page.tsx
  idle/page.tsx
  inventory/page.tsx
  characters/page.tsx
  boss/page.tsx
  rankings/page.tsx
  logs/page.tsx
  api/
    login/route.ts
    claim/route.ts
    equip/route.ts
    boss/route.ts

components/
  layout/
    MobileShell.tsx
    BottomNav.tsx
  game/
    PlayerSummary.tsx
    RegionCard.tsx
    RewardModal.tsx
    ItemCard.tsx
    EquipmentSlot.tsx
    BossCard.tsx
    RankingList.tsx
    GameLogList.tsx

lib/
  db.ts
  auth.ts
  game/
    idle.ts
    loot.ts
    equipment.ts
    power.ts
    combat.ts
    boss.ts
    region.ts
    economy.ts
    random.ts
    daily-tasks.ts
  ai/
    generateIdleLog.ts
    generateItemName.ts
    validateAIOutput.ts

prisma/
  schema.prisma
  seed.ts

data/
  inviteCodes.json
  regions.json
  bosses.json
  itemBases.json
  affixes.json
  dropTables.json
  materials.json
  daily-tasks.ts

tests/
  idle.test.ts
  loot.test.ts
  equipment.test.ts
  power.test.ts
  combat.test.ts
  boss.test.ts
  ranking.test.ts
  daily-tasks.test.ts

docs/
  PRODUCT_SPEC.md
  GAME_RULES.md
  TECH_SPEC.md
  CODEX_RULES.md
  ACCEPTANCE.md
```

## Routing Plan

### Main Pages

- `/login`
- `/home`
- `/idle`
- `/inventory`
- `/characters`
- `/boss`
- `/rankings`
- `/logs`

### Routing Notes

- `/` may redirect to `/home` or `/login` based on auth state
- Layout should include a shared mobile shell and bottom navigation
- Every page should be safe to refresh directly

## Auth Plan

### V1 Auth Model

- Invite-code-based login only
- Nickname entered on first login
- Session persisted with secure cookie or equivalent server session strategy

### Requirements

- Invalid invite codes rejected
- Existing invite-code users return to the same player
- Refresh must preserve session
- Invite codes must not be shipped to the client as a public source of truth

## Data Model Plan

### Initial Models

- `InviteCode`
- `User`
- `Player`
- `GameLog`

### Phase 2 and 3 Models

- `ItemInstance`
  - stores rolled combat stats, `affixIds`, and serialized `affixStats` so gear detail panels can render actual affix value lines
- `MaterialStack`
- `PlayerUnlockedRegion` or `RegionProgress`

### Later Models

- `WorldBoss`
- `WorldBossAttackLog`
- `Blessing`
- `TaskProgress`
- `Codex-safe admin tables only if required`

## Server Responsibilities

### Route Handlers or Server Actions

Server-side operations must own:

- Login
- Claim rewards
- Change region
- Equip item
- Challenge boss
- Read rankings
- Read logs

### Transactional Operations

The following operations should run transactionally when implemented:

- Idle reward claim
- Equip swap and power update
- Boss challenge result and unlock write
- World boss damage and reward grant

## UI Requirements

- Portrait mobile first
- 360px to 430px widths supported
- Buttons minimum height 44px
- Fixed bottom navigation
- Clear loading and error states
- No horizontal scrolling in normal flows

## Data Strategy

### Config-Driven Content

These should come from JSON or typed config files:

- Regions
- Bosses
- Item bases
- Affixes
- Drop tables
- Materials
- Invite code seed values
- Daily task definitions

### Why

- Easier tuning without touching UI
- Clear separation between code and balance data
- Simpler testing and content expansion

## Testing Strategy

### Unit Tests

Mandatory for:

- Idle math
- Loot generation
- Power calculation
- Equipment replacement
- Boss chance and challenge logic
- Ranking sort
- Daily task progress, claiming, and anti-duplicate guards
- Late-game gate reachability and displayed-power formula drift

### Integration Tests

Recommended for:

- Login flow
- Claim reward flow
- Equip flow
- Boss challenge flow

### Device Validation

Manual checks:

- 360px width Android Chrome
- 390px width iPhone Safari
- 430px width large-screen mobile
- WeChat embedded browser if used by players

## Environment Variables

Expected initial environment keys:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`
- `DEEPSEEK_API_KEY` for later AI features only

`DEEPSEEK_API_KEY` must be optional in V1 and absence must not break gameplay.

## Deployment Notes

- PostgreSQL is the default database for both local and production environments
- Production deployment should use a persistent hosted database or a self-hosted PostgreSQL instance before real friend usage
- `npm run build` must pass before deployment
- Prisma migration strategy must be documented in README

## Performance and Scale

Scale target is tiny, but stability still matters.

- Optimize for correctness over premature optimization
- Keep payloads small for mobile
- Avoid heavy client state libraries unless clearly needed
- Prefer server rendering or server actions where it simplifies correctness

## Security Constraints

- Validate all write requests on the server
- Never trust client-sent reward totals or power values
- Never expose admin reset routes in production
- Avoid leaking invite code lists to the client bundle

## Non-Functional Release Requirements

- Local setup should work from README alone
- Seed should create 5 working invite codes
- Build should pass
- Core gameplay actions should have automated coverage
- No core path should depend on AI availability
