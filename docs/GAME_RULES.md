# Game Rules

## Rule Boundaries

Core rule authority lives in `lib/game`.

- UI components must never contain source-of-truth formulas
- AI output must never affect rewards, drop rates, battle results, or unlock state
- Data tables live in `data`

## Core Entities

- User: invite-based login identity
- Player: persistent progression profile
- Character: optional stat holder for future role flavor
- ItemInstance: generated equipment instance owned by a player
- MaterialStack: stackable crafting or progression resource
- GameLog: player or global event record

## Progression Loop

```text
Choose region
  -> accumulate offline time
  -> claim rewards
  -> receive gold, exp, materials, and possible gear
  -> auto-level from cumulative exp
  -> equip upgrades
  -> recalculate power
  -> challenge boss
  -> unlock next region
```

## Level Rules

### Level Cap

- The theoretical maximum player level is `3000`
- New players start at `level 1` with `0` total exp
- Level is always derived from total exp, not edited independently during normal gameplay

### Exp Curve

From level `L - 1` to `L`, the required exp step follows the classic nonlinear rule:

```text
deltaExp(L) = floor((floor((L - 1) + 300 * 2 ^ ((L - 1) / 7))) / 4)
```

Equivalently, total exp required to reach level `L` is:

```text
totalExp(L) = floor(
  1 / 4 * sum from n = 1 to L - 1 of floor(n + 300 * 2 ^ (n / 7))
)
```

### Level Update Rule

- Any exp gain from idle, bosses, world boss rewards, blessings, or admin tools must immediately recalculate level
- Stored total exp is the source of truth
- UI may show per-level progress, but must not invent its own level formula

## Idle Reward Rules

### Time Calculation

- Reward time is based on `now - lastClaimAt`
- Minimum claimable duration: 1 minute
- Maximum stored duration: 12 hours
- Reward calculations use full server-side time math
- Claim must update `lastClaimAt` atomically with reward grant

### Anti-Duplicate Rule

- The same idle duration can only be claimed once
- A repeated click must not re-grant the same rewards
- The claim flow should use a transaction or equivalent guard

### Idle Reward Formula

For a given region:

```text
claimableMinutes = clamp(floor(elapsedMs / 60000), 0, 720)
goldReward = region.goldPerMinute * claimableMinutes
expReward = region.expPerMinute * claimableMinutes
finalGoldReward = goldReward * (1 + totalGoldBonus / 100)
finalExpReward = expReward * (1 + totalExpBonus / 100)
materialReward = region material rules * claimableMinutes
equipmentRolls = region drop table rules adjusted by drop bonus
```

### Reward Composition

- Gold: stable output
- Experience: stable output
- Materials: stable output from region table
- Equipment: probability-based output from drop table

## Region Rules

### Region Access

- Every player starts in `region_001`
- A player may only switch to a region they have unlocked
- A player may only enter a region if their power meets the region requirement

### Region Config

Each region must define:

- `id`
- `name`
- `requiredPower`
- `goldPerMinute`
- `expPerMinute`
- `dropTableId`
- `bossId`
- `unlocksRegionId` if applicable

### Current Main Route

- `region_001` Newbie Bamboo Grove
- `region_002` Icefish River
- `region_003` Abandoned Dojo
- `region_004` Snow Mine
- `region_005` Ember Peak
- `region_006` Stormfen Marsh
- `region_007` Moonshadow Shrine
- `region_008` Venom Mistwood
- `region_009` Starcrystal Rift
- `region_010` Abyssfire Bastion

## Equipment Rules

### Slots

- `weapon`
- `helmet`
- `armor`
- `boots`
- `bracer`
- `amulet`
- `ring`

### Rarities

- `common`
- `rare`
- `epic`
- `legendary`

### Drop Weight Baseline

```ts
{
  common: 7500,
  rare: 2000,
  epic: 450,
  legendary: 50
}
```

These values are tuning defaults and may be adjusted through data config.

### Equipment Constraints

- Each item belongs to exactly one slot
- `weapon`, `helmet`, `armor`, `boots`, `bracer`, and `amulet` each have capacity `1`
- `ring` has capacity `2`
- Equipping a new item in an occupied position replaces the old equipped item in that position
- Item stats must come from deterministic config plus random rolls within defined bounds

### Allowed Stats

- `attack`
- `defense`
- `hp`
- `luck`
- `crit`
- `goldBonus`
- `expBonus`
- `dropBonus`

### Item Generation Rules

- Base item determines slot and stat profile
- Rarity affects stat scaling and affix count
- Affix counts are: `common = 0`, `rare = 1`, `epic = 2`, `legendary = 3`
- Idle drops first select a regional clan/theme, then roll base items and affixes within that themed pool
- Main-route bosses remain one-time gate clears, so their special gear value comes from first-clear bonus rewards rather than repeat farming
- Forging uses the current highest unlocked region as its workshop source and follows the same regional gear identity
- Affixes come from allowed config pools with slot restrictions, theme bias, and late-region weighting
- `luck` may bias rarity weights toward better outcomes, but does not bypass configured pools
- No item may roll stats outside configured min and max bounds

### Equipment Display Rules

- Rare or better items should show affix-driven naming
- Equipment detail UI should expose:
  - base item
  - family / lineage
  - source region
  - rarity
  - affixes
  - enhancement level
  - effective stat lines
- Affix detail blocks should show only stat lines and values, not explanatory prose

## Power Rules

### V1 Power Formula

```text
power = attack * 2 + defense * 1.5 + hp * 0.2 + luck * 1 + crit * 2.5
```

Implementation notes:

- Use one shared function in `lib/game/power.ts`
- Round consistently in one place only
- Rankings and access gates must use the same computed value source
- Player level must not directly increase power
- `goldBonus`, `expBonus`, and `dropBonus` still do not directly raise displayed power

## Secondary Stat Rules

### Reward Stats

- `goldBonus` multiplies idle, boss, world boss, and blessing gold rewards
- `expBonus` multiplies idle, boss, world boss, and blessing exp rewards
- `dropBonus` increases effective equipment roll count

### Combat Stats

- `crit` improves main boss effective win chance
- `crit` improves world boss damage
- `luck` continues to contribute to power
- `luck` also biases loot rarity weights and lightly supports combat bonuses

## Boss Rules

### Basic Boss Flow

- Each region has one boss
- A player challenges the boss of their current or highest unlocked region
- Boss challenges are limited per day
- A win grants rewards and may unlock the next region

### Win Chance Formula

```text
winChance = clamp(playerPower / bossPower, 0.1, 0.95)
```

Applied combat modifiers:

```text
finalWinChance = clamp(winChance + crit * 0.003 + luck * 0.0015, 0.1, 0.95)
```

### Challenge Rules

- Result is system-determined, never AI-determined
- Boss rewards come from config tables
- First clear should create a notable log event
- Repeated clears may have daily limits or reduced rewards
- Unlock-gate validation uses the next region's recommended power before the current boss can be challenged for progression

### Unlock Rules

- Defeating a region boss unlocks the configured next region
- Unlock state must persist in the database
- Unlocking a region does not automatically move the player into it

## Ranking Rules

### V1 Ranking Fields

- Nickname
- Level
- Power
- Highest unlocked region

### Sort Order

- Primary sort: power descending
- Secondary sort: level descending
- Tertiary sort: createdAt ascending or id ascending for deterministic order

## Daily Task Rules

### Task Definitions

Daily tasks are defined in `data/daily-tasks.ts`. Each task specifies:

- `id` - unique task identifier
- `logType` - GameLog type used for progress counting
- `target` - completion threshold
- `reward` - gold, exp, and optional materials granted on claim

### Progress Tracking

- Task progress is derived by counting `GameLog` entries for the player matching `logType` within the current `dayKey`
- Progress is synced to `PlayerDailyTask` records on home page load
- Task types track **actions attempted** (not outcomes): boss challenges count regardless of win/loss, dismantles count operations not items

### Claim Rules

- Rewards can only be claimed once per task per day
- A task must reach its `target` count before claiming
- Claims are handled in a database transaction to prevent double-claiming
- Claimed rewards apply `goldBonus`/`expBonus` from equipped gear as with other reward sources

### Current Task List

| Task | Log Type | Target | Rewards |
|------|----------|--------|---------|
| Idle Farmer | `IDLE_CLAIM` | 3 | 80 gold, 50 exp |
| Trial by Combat | `BOSS_CHALLENGE` | 1 | 80 gold, 50 exp |
| Daily Blessing | `BLESSING` | 1 | 40 gold, 25 exp |
| Gear Upgrade | `EQUIPMENT_ENHANCE` | 1 | 60 gold, 35 exp, iron ore ×3 |
| Dismantle & Recycle | `ITEM_DISMANTLE` | 1 | 50 gold, 30 exp |

## Friend Activity Rules

### Activity Feed

- The home page "Village News" section displays recent global `GameLog` entries (`playerId: null`)
- Eligible log types include `BOSS_CLEAR`, `REGION_UNLOCK`, `RARE_DROP`, `BLESSING`, `WORLD_BOSS_CLEAR`
- Messages are displayed with relative timestamps
- The feed does not reveal private player activity (only previously-global events)

## Global Log Rules

### Event Types

- Idle claim
- Rare item drop
- Boss challenge (win or lose)
- Boss clear
- Region unlock
- World boss events in later phases
- Blessing events in later phases
- Equipment enhance
- Item dismantle
- Daily task reward claim
- Daily task log messages are now localized（Chinese/English based on player locale）

### Logging Rules

- Logs reflect real game events only
- AI-generated flavor text may decorate a real event but cannot invent one
- Rare drops and first clears should be eligible for global visibility
- Rare drop and world boss clear global events can be decorated with AI-generated flavor text via `lib/ai/global-log.ts`
- AI flavor falls back to pre-built text on timeout or API failure (2s timeout)

## AI Content Rules

AI may be used only for presentation-layer content such as:

- Idle log narration
- Rare item naming flavor
- Boss lore text
- Global event flavor（rare drops, world boss final blows）

AI may never decide:

- Drop probabilities
- Item stats
- Reward quantities
- Power values
- Boss results
- Unlock state
- Ranking order

## Forge Rules

### Rarity Distribution

Forge（定向锻造）uses its own fixed rarity weights, independent of region drop tables:

| Rarity | Weight |
|--------|--------|
| Common | 90% |
| Rare | 8% |
| Epic | 1.5% |
| Legendary | 0.5% |

### Extra Affix

- 5% chance to upgrade rarity by one tier（common → rare, rare → epic, epic → legendary）
- This applies after the initial rarity roll, effectively giving items a chance for more affixes

### Confirmation

- All forge actions require a game-internal confirmation modal before execution
- The modal shows the exact materials and gold cost
- Results are displayed via a banner on the redirected inventory page

## Dismantle Rules

### Bulk Dismantle

- "一键分解" dismantles **all** unequipped and unlocked items across all pages
- No item IDs are passed client-side; the server action queries all eligible items
- A confirmation modal warns the user before execution
- Results are displayed via a banner showing the count of dismantled items

### Single Dismantle

- Single-item dismantle in the detail panel also requires confirmation

## Craft Rules

### Confirmation

- All craft actions require a game-internal confirmation modal
- The modal shows the exact ingredient costs and output
- Results are displayed via a banner on the redirected inventory page

## Operation Confirmation Standard

All irreversible operations that consume resources must use game-internal confirmation modals, not browser `confirm()` dialogs. The affected operations are:

- Forge（定向锻造）
- Craft（材料合成）
- Bulk dismantle（一键分解）
- Single dismantle（分解回收）


## Testing Rules

The following rule categories require automated tests:

- Idle reward time math
- 12-hour cap
- Duplicate-claim prevention
- Region access gating
- Loot rarity generation bounds
- Equip replacement behavior
- Power formula stability
- Boss win chance boundaries
- Region unlock persistence
- Ranking sort correctness
- Late-game gate reachability using the shared static balance estimator

## Balance Notes

- Region 6-10 progression is intentionally slower, but it must remain reachable with real combat-oriented gear growth
- The repository now keeps two balance checks:
  - `npm run sim:economy` for conservative progression pacing
  - `npm run sim:balance` for optimistic best-set ceilings against gates and bosses
- `sim:economy` is intentionally conservative because it does not fully model a human player manually reforging and targeting upgrades
