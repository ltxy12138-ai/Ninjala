# Acceptance Criteria

## Purpose

This document defines what "done" means at each phase so implementation can stay small, testable, and release-oriented.

## Phase 0: Documentation

### Deliverables

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_RULES.md`
- `docs/TECH_SPEC.md`
- `docs/CODEX_RULES.md`
- `docs/ACCEPTANCE.md`

### Acceptance

- Product scope is explicit
- Version 1 includes only the intended systems
- Non-goals are explicit
- Core gameplay formulas are documented
- File ownership boundaries are documented
- A future coding task can reference these docs without guessing intent

## Phase 1: Project Skeleton and Login

### Deliverables

- Next.js App Router project
- Tailwind setup
- Prisma schema and local PostgreSQL setup
- Invite-code login flow
- Player creation or reuse
- Mobile shell and bottom navigation
- Placeholder versions of all main pages
- Local setup instructions in README

### Acceptance

- `npm install` succeeds
- `npm run dev` succeeds
- Prisma migration succeeds
- Seed creates 5 invite codes
- Valid invite code can create or resume a player
- Refresh preserves login state
- `/home`, `/idle`, `/inventory`, `/characters`, `/boss`, `/rankings`, and `/logs` all load without crashing
- Home page shows nickname, level, exp, gold, and power

### Required Tests

- Empty invite code rejected
- Invalid invite code rejected
- Existing invite code does not create duplicate player
- Basic mobile layout works at 390px width

## Phase 2: Idle Regions and Offline Rewards

### Deliverables

- Region config data
- Region switching
- Offline reward claim flow
- Gold and exp rewards
- Material rewards
- Claim log creation

### Acceptance

- Player can view unlocked regions
- Power-gated regions are blocked
- Player can set active idle region
- Claim reward uses elapsed offline time
- Claim caps at 12 hours
- Claim updates `lastClaimAt`
- Repeated clicks do not duplicate rewards
- Reward result is visible in UI
- Logs show claim events

### Required Tests

- 60-minute reward calculation
- 12-hour cap behavior
- Duplicate-claim prevention
- Region switch changes reward source
- Power gate blocks advanced region

## Phase 3: Loot, Inventory, Equipment, Power

### Deliverables

- Item base config
- Affix config
- Drop tables
- Item instance model
- Equipment drop generation
- Inventory page
- Equip and unequip flows
- One-click best equip
- Unified power calculation

### Acceptance

- Claims can grant items
- Items persist in inventory
- Each item shows slot, rarity, and stats
- Player can equip an item
- Equipping replaces same-slot gear
- Power updates after equipment changes
- Rankings reflect updated power
- One-click equip never lowers power

### Required Tests

- Loot generation stays in configured bounds
- Rarity weight behavior is valid
- Same-slot replacement works
- Power formula is stable
- Best-equip logic does not reduce power

## Phase 4: Bosses, Unlocks, Rankings

### Deliverables

- Boss config
- Boss challenge service
- Win chance calculation
- Boss reward grant
- Region unlock persistence
- Ranking page
- Rare drop and first-clear global logs

### Acceptance

- Boss page shows available boss data
- Player can challenge boss
- Challenge produces win or loss
- Win grants reward
- Win unlocks next region when applicable
- Ranking page sorts players correctly
- First clears and rare drops appear in logs

### Required Tests

- Win chance boundary behavior
- Low-power player has lower success odds
- Correct region unlock on win
- Daily challenge limit enforced
- Ranking sort order correct

## Phase 5: Mobile Polish and Deployment Readiness

### Deliverables

- Improved mobile layouts
- Loading and error UI
- Reward modal
- Build-ready project
- Updated README
- Development-only reset or admin tools if needed

### Acceptance

- `npm run build` passes
- No normal flow has horizontal scrolling
- All major actions are touch-friendly
- Login, claim, equip, boss, ranking, and logs work end to end
- README is enough for another developer to boot the project

### Manual Device Matrix

- 360px Android Chrome
- 390px iPhone Safari
- 430px large-screen phone
- WeChat embedded browser if relevant to actual players

## Phase 6: AI Flavor Logs

### Deliverables

- AI idle log generator
- AI output validator
- Template fallback path
- Optional API-key-based integration

### Acceptance

- Real rewards are granted before AI is called
- AI can only describe true reward payloads
- Invalid or missing AI output falls back safely
- Missing `DEEPSEEK_API_KEY` does not break gameplay
- Failed AI generation does not roll back granted rewards

### Required Tests

- AI success case
- AI timeout fallback
- Invalid JSON fallback
- Fabricated reward fallback
- No API key fallback

## Phase 7: Friend Interaction

### Deliverables

- World boss model and flow
- Shared HP handling
- Attack limits
- Participation rewards
- Blessing system
- Social log events

### Acceptance

- All players see the same world boss state
- Daily attack limit is enforced
- Shared HP cannot go negative due to concurrency bugs
- Participants can claim correct rewards
- Duplicate reward claims are blocked
- Blessings are limited correctly and affect rewards as designed

## Phase 8: Closed-Test Hardening

### Deliverables

- Simulation scripts
- Test plan
- Core error handling pass
- Duplicate-submission guard review
- Empty-state review

### Acceptance

- Automated tests pass
- Build passes
- Simulation output shows no obvious economy explosions
- No blocking bug remains in core progression flows
- 5 friends can complete day-one play without critical failure

## V1 Release Gate

The first external friend test should not happen until all are true:

- Login is stable
- Save persistence is stable
- Idle rewards cannot be double-claimed
- Boss rewards cannot be double-claimed
- Power calculation is consistent
- Gear cannot roll extreme out-of-bounds values
- Rankings are correct
- AI failure cannot block rewards
- Project builds successfully
- Mobile experience is acceptable on target devices

## Ongoing Quality Bar

Any future feature should be rejected or revised if it:

- Puts formulas in UI
- Lets AI influence core game outcomes
- Adds large system complexity without clear player value
- Introduces untested critical logic
- Hurts mobile usability
