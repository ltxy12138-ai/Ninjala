# Codex Rules

## Role

You are a development collaborator for this repository.

The project is a mobile-first browser idle RPG for a private group of 5 players.

Your job is to help implement features safely, incrementally, and with strong separation between UI, rules, and data.

## Project Constraints

- The project is not a commercial live-service build
- The player count is tiny
- Stability and clarity matter more than feature count
- Mobile web is the primary target

## Hard Rules

1. Do not place source-of-truth gameplay formulas inside page components.
2. Put all core game logic in `lib/game`.
3. Put AI-only text helpers in `lib/ai`.
4. Put tunable content and drop data in `data`.
5. Manage schema changes through Prisma.
6. Do not let AI determine drop rates, reward amounts, item stats, battle outcomes, unlocks, or ranking results.
7. Every core function must be typed in TypeScript.
8. Every gameplay feature must add or update automated tests.
9. Prefer small dependencies. Do not add large packages unless the benefit is clear and documented.
10. Preserve mobile usability in every UI change.
11. Do not silently remove existing features.
12. When changing data models, update migration and seed behavior together.
13. Keep routes, components, and business logic separated.
14. Server-side validation is required for all state-changing operations.

## Code Organization Rules

### Allowed Responsibilities

`app/*`

- Route structure
- Page composition
- Data fetching orchestration
- User interaction wiring

`components/*`

- Presentational UI
- Reusable interactive controls
- No gameplay formulas beyond local display formatting

`lib/game/*`

- Idle reward math
- Loot generation
- Power calculation
- Equip rules
- Boss rules
- Region gating
- Economy and progression logic

`lib/ai/*`

- Prompt construction
- Response parsing
- Output validation
- Template fallback behavior

`data/*`

- Static content tables
- Balance inputs
- Starter seeds

## Testing Rules

- Add unit tests for every new core gameplay module
- Add regression tests for every bug fix in core logic
- Keep formulas deterministic when possible
- Inject randomness through testable helpers
- If randomness is used, support seeded or mocked testing paths

## Mobile UI Rules

- Design for portrait use first
- Avoid wide tables or dense desktop layouts
- Target 360px, 390px, and 430px widths
- Buttons should be touch-friendly
- Critical actions need clear loading and disabled states

## AI Rules

AI is presentation-only.

Allowed:

- Narration
- Flavor text
- Item naming for already-generated items
- Boss lore

Forbidden:

- Choosing who wins
- Changing reward totals
- Generating hidden game state
- Creating items that do not exist in the result payload
- Overwriting server-calculated values

## Delivery Rules

For each task:

- Explain assumptions briefly if needed
- Make the smallest safe change that completes the goal
- Update tests
- Run relevant verification when possible
- Report changed files, how it was tested, and remaining risks

## Preferred Task Format

When receiving work, interpret the following structure:

```text
Task:
Background:
Current state:
Implement:
Constraints:
Files:
Tests:
Acceptance:
Do not do:
```

If the request is ambiguous, prefer the narrowest implementation that matches the stated acceptance criteria.

## Review Checklist

When reviewing or self-checking, inspect for:

- Gameplay logic leaked into UI
- Duplicate reward claims
- Incorrect state persistence
- Item stat overflow
- Missing empty states
- Mobile layout regressions
- Any use of `any` that can be removed
- Missing tests
- AI overreach into game authority

## Safe Defaults

- Prefer deterministic server authority
- Prefer config-driven tuning
- Prefer simple formulas over opaque systems
- Prefer incremental implementation over speculative architecture
