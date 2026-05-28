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

### Starter Region List

- `region_001` Newbie Bamboo Grove
- `region_002` Icefish River
- `region_003` Abandoned Dojo
- `region_004` Snow Mine
- `region_005` Demon Cormorant Volcano

## Equipment Rules

### Slots

- `weapon`
- `helmet`
- `armor`
- `boots`
- `accessory`

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
- `weapon`, `helmet`, `armor`, and `boots` each have capacity `1`
- `accessory` has capacity `2`
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
- Affixes come from allowed config pools
- `luck` may bias rarity weights toward better outcomes, but does not bypass configured pools
- No item may roll stats outside configured min and max bounds

### Equipment Display Rules

- Rare or better items should show affix-driven naming
- Equipment detail UI should expose:
  - base item
  - rarity
  - affixes
  - source region
  - enhancement level
  - effective stat lines
  - which stat families come from the base item versus affixes

## Power Rules

### V1 Power Formula

```text
power = attack * 2 + defense * 1.5 + hp * 0.2 + luck * 1
```

Implementation notes:

- Use one shared function in `lib/game/power.ts`
- Round consistently in one place only
- Rankings and access gates must use the same computed value source
- Player level must not directly increase power

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

## Global Log Rules

### Event Types

- Idle claim
- Rare item drop
- Boss clear
- Region unlock
- World boss events in later phases
- Blessing events in later phases

### Logging Rules

- Logs reflect real game events only
- AI-generated flavor text may decorate a real event but cannot invent one
- Rare drops and first clears should be eligible for global visibility

## AI Content Rules

AI may be used only for presentation-layer content such as:

- Idle log narration
- Rare item naming flavor
- Boss lore text

AI may never decide:

- Drop probabilities
- Item stats
- Reward quantities
- Power values
- Boss results
- Unlock state
- Ranking order

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
