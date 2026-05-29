# Launch Checklist

## Database

- Production database is provisioned
- `DATABASE_URL` points to the production database
- Prisma migrations have been applied successfully
- Invite codes have been seeded

## Security

- Session/auth secret is configured
- `/admin` is disabled in production or additionally locked down
- No test-only destructive operation is exposed to normal players

## Gameplay Verification

- New account registration works with a fresh invite
- Invite reuse is correctly blocked
- Username + password login works after registration
- Idle rewards claim successfully
- Equipment can be equipped and unequipped
- Dual accessory slots behave correctly
- Gold/exp/drop/crit/luck bonuses affect real gameplay outcomes
- Boss rewards and unlocks work
- World boss damage and reward claims work
- Blessings work once per day

## UI Verification

- Chinese is the default language
- Language toggle still works
- No main mobile page requires excessive long scrolling for core actions
- Reward modals, tab switches, and same-page actions do not jump to the top unexpectedly

## Operations

- Build passes in production mode
- Logs are readable enough to debug a failed login or reward claim
- At least one owner account has been verified before friend invites are sent

## Go / No-Go

- If database, login, or reward persistence is unstable: `NO-GO`
- If only minor text or layout polish remains: `GO` for a small private test
