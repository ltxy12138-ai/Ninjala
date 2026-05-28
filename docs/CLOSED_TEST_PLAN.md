# Closed-Test Hardening Plan

## Purpose

This document is the working checklist for Phase 8.

It covers:

- simulation commands
- day-one friend test focus areas
- duplicate-submission guard review
- empty-state review
- current findings from the first economy sweep

## Simulation Commands

Run these from the project root:

```bash
npm run sim:idle
npm run sim:drops
npm run sim:players
npm run sim:economy
```

What each command is for:

- `sim:idle`: sanity-checks hourly and capped idle outputs by region
- `sim:drops`: checks rarity distribution and average item power by drop table
- `sim:players`: simulates a 5-player cohort over 3, 7, and 14 days
- `sim:economy`: runs a 20-seed sweep and reports progression-speed / gold-sink warnings

## Sweep Findings

### Initial sweep on 2026-05-27

- Day 3 final-region reach rate: `1.00`
- Day 14 average stored gold: `113423`
- Result: failed the first balance sanity check

### After Phase 8 pacing pass on 2026-05-27

- Day 3 final-region reach rate: `0.63`
- Day 14 average stored gold: `6507`
- Day 14 average power: `283`
- Result: current `sim:economy` run returns `warnings=none`

What changed:

- main-boss attempts are now effectively shared across the progression route per day
- boss power curve was raised
- idle drop density was lowered
- enhancement costs were raised and enhancement stat growth was reduced

Interpretation:

- The economy no longer shows the earlier obvious inflation warning.
- Progression is slower and more stable than the first pass.
- This is good enough for continued hardening, but still not a substitute for manual friend playtesting.

## Duplicate-Submission Guard Review

Reviewed paths:

- Idle reward claim
  - Guard: transactional compare-and-swap on `lastClaimAt`
  - Evidence: `app/actions/idle.ts`, `lib/game/idle-service.ts`, `tests/idle.test.ts`
- Main boss challenge
  - Guard: transactional boss progress update with shared daily main-route limit
  - Evidence: `app/actions/boss.ts`, `lib/game/boss.ts`, `tests/boss.test.ts`
- World boss reward claim
  - Guard: reward-claim event lookup inside transaction
  - Evidence: `app/actions/boss.ts`, `lib/game/world-boss.ts`, `tests/world-boss.test.ts`
- Blessing
  - Guard: unique `(playerId, dayKey)` constraint
  - Evidence: `prisma/schema.prisma`, `app/actions/social.ts`, `lib/game/blessing.ts`
- Equip / enhance / dismantle / forge / reforge
  - Result: no known duping path found in a quick review, but these flows rely more on state mutation safety than idempotent request keys
  - Follow-up: browser-side pending-state disabling is still worth adding later

## Empty-State Review

Reviewed pages:

- `/home`
  - Safe: route cards and status cards do not require dynamic collections
- `/idle`
  - Safe: materials tab handles empty stash, overview handles zero-material preview
- `/inventory`
  - Safe: empty page slots render placeholder cells and empty detail panel
- `/characters`
  - Safe: empty equipped slot shows explicit empty-state card
- `/boss`
  - Safe: missing boss data and blocked actions render explicit messages
- `/rankings`
  - Safe: blessing tab handles self-row and sent-today lock state
- `/logs`
  - Safe: filtered empty results render explicit guidance

## Core Error Handling Pass

Confirmed:

- server actions redirect with explicit result/error params instead of crashing normal UI flows
- major reward flows show user-facing success/error surfaces
- AI idle log failure cannot roll back rewards
- world boss and blessing flows surface lock reasons

Still worth adding later:

- browser-visible pending/disabled states for every submit button
- one smoke test pass in a real browser for rapid double taps on mobile

## Day-One Friend Test Checklist

Before inviting 5 friends:

1. Run `npm run test`
2. Run `npm run lint`
3. Run `npm run build`
4. Run `npm run sim:economy`
5. Verify no new blocking warning appears in the sweep output
6. Manually test login, one idle claim, one equip, one boss attempt, one blessing, one world boss reward flow

## Exit Criteria For Phase 8

Phase 8 should be considered ready to close when:

- all automation commands above run successfully
- no core-flow correctness bug is open
- progression speed is retuned to a friend-testable pace
- gold sinks are strong enough that the economy sweep no longer flags obvious inflation
