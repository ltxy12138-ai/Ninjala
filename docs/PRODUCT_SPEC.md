# Product Spec

## Project Summary

Project name: `idle-friends-rpg`

Positioning:

- A mobile web idle loot RPG for up to 5 friends
- Designed for private friend-group play, not public-scale live ops
- Focused on stable progression, loot excitement, and lightweight social comparison

Core fantasy:

- Log in with an invite code
- Pick an idle region
- Come back later to claim rewards
- Upgrade gear and power
- Beat bosses to unlock new regions
- Compare progress, drops, and rankings with friends

## Product Goals

### Primary Goal

Ship a small but polished mobile browser game that 5 people can actually play every day.

### Success Criteria

- A new player can start and understand the loop within 3 minutes
- The first reward claim feels satisfying within 10 minutes
- Players have a clear short-term goal: claim, equip, grow power
- Players have a clear medium-term goal: beat the current boss and unlock the next region
- Friends can compare rankings and discuss rare drops

## Target Users

- 5 invited friends
- Mobile-first casual players
- Users who prefer short check-in sessions over long play sessions

## Core Gameplay Loop

```text
Open game
  -> log in with invite code
  -> view current player status
  -> choose idle region
  -> wait offline
  -> claim gold, exp, materials, gear
  -> equip better items
  -> increase power
  -> challenge boss
  -> unlock next region
  -> check rankings and server logs
```

## Version 1 Scope

### Must Have

- Invite-code login
- Persistent player creation
- Mobile-first UI
- Home page with player summary
- Idle region selection
- Offline reward claiming
- Gold and experience progression
- Material drops
- Equipment drops
- Inventory page
- Equipment management
- Power calculation
- Boss challenge
- Region unlock progression
- Friend rankings
- Global activity log
- Deployable web build

### Should Have If Time Allows

- Reward claim modal
- One-click equip best gear
- Rare-drop highlight in logs
- Basic admin-only seed or reset flow for development

### Version 2

- AI idle logs
- AI item naming for selected rare items
- AI boss lore
- World boss
- Blessings between friends
- Daily tasks
- Collection book
- Set bonuses
- PWA icon and install flow

### Explicitly Out of Scope

- Payments
- Gacha
- Player trading
- PvP
- Complex chat
- Guilds
- Real-time multiplayer combat
- Complex battle animation systems
- Open-world simulation
- AI-controlled loot, power, battle outcome, or economy

## Theme Direction

Recommended theme for V1: `Penguin Ninja Village`

Reason:

- Distinctive and memorable
- Already aligned with prior art direction
- Easy to create recognizable regions, bosses, and loot names

Suggested starter cast:

- Li: defense-focused frontliner
- Hu: poison dart rogue with crit and luck flavor
- Zhao: gold and drop efficiency specialist
- Zhou: tanky protector with shield flavor

## Content Targets For V1

- 5 regions
- 5 bosses
- 30 base item templates minimum
- 20 affixes minimum
- 5 material types minimum
- 5 invite codes
- 1 global ranking
- 1 global event log

## Session Design

- Play sessions should work well in 1 to 5 minute bursts
- Core actions must be thumb-friendly on a phone
- Most sessions should involve one meaningful outcome:
  claim rewards, equip upgrade, beat boss, or check ranking changes

## UX Principles

- Mobile portrait first
- Important information visible without dense UI
- Buttons large enough for touch
- Fast access to idle, inventory, boss, and rankings
- No horizontal scrolling on target phone widths

## Social Design

The game should create lightweight social friction without demanding coordination.

Desired social moments:

- "I got a rare drop"
- "I finally unlocked the next region"
- "You passed me on power"
- "Who gets boss first clear"

## Non-Goals

This project is not trying to be:

- A scalable MMO
- A content-heavy live-service economy
- A real-time combat sim
- A generative AI sandbox

## Release Standard

V1 is ready for friend testing when all of the following are true:

- Login is stable
- Saves persist across refreshes
- Idle rewards cannot be double-claimed
- Gear drops and equip flow work end to end
- Boss unlock progression works
- Rankings update correctly
- The app is usable on common phone widths
