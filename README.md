# UNDEFEATED — The All-Time War Draft

**Play it live: https://nickciccone03-gif.github.io/undefeated/**

A daily parody war-draft game. Draft an army across 3,000 years of history — Genghis Khan
commanding the US Air Force, Sacred Geese on night watch — then march it through **all 50
of history's defining wars, in chronological order**, from the Hot Gates to the Gulf.
Can you go 50–0?

**Stack:** Vite + React + TypeScript. No backend, no APIs, no accounts. Fonts self-hosted
via Fontsource (Staatliches / Special Elite / IBM Plex Mono).

Product spec: [SCOPE.md](SCOPE.md) · Decision log: [DECISIONS.md](DECISIONS.md) ·
Stat rubric: [RATINGS.md](RATINGS.md)

```bash
npm install
npm run dev        # play at http://localhost:5173/undefeated/
npm run build      # production build → dist/
npx tsx scripts/balance.ts   # slate lint + balance report
```

## How it works

Everything is **deterministic per local calendar day** (Wordle convention):

- `src/game/rng.ts` — seeded PRNG (mulberry32). Day seed = hash of `YYYY-MM-DD`.
- `src/game/roster.ts` — the draft pool: 80 picks across 8 slots, each with 7 stats,
  era year, terrain affinities, a special rule, and bespoke joke lines.
- `src/game/campaigns.ts` — **THE 50 WARS**: named historical challenge cards
  (Greco-Persian → Gulf), objective-framed ("establish and supply a beachhead" — never
  "defeat <population>"), WWII split by theater, five boss fights. Domain quotas
  (naval/air/siege/irregular/terrain/logistics/intel) linted by `scripts/balance.ts`.
- `src/game/engine.ts` — scoring (ruleset v3): seat-emphasis-weighted stats (each war
  listens hardest to the seats it is about) × commander multiplier + terrain + specials
  − SUSTAINMENT (logistics tech vs. hungriest unit, basing folded in) − C2 (a delta vs.
  a reference staff: adaptability + Intel INT + doctrine-bridge picks), vs. per-war
  difficulty + shared daily "weather". Same picks ⇒ same record, globally.
  - One `warScore` kernel feeds both the player's season and `rankTeams`' exhaustive
    enumeration ("Army #982 of 92,331", COMMAND HQ CEILING); `scripts/parity.ts` gates
    CI on the two paths agreeing exactly.
  - **Daily ceilings vary by design.** Hard days are content, and the board is never
    rerolled to force perfection. Command HQ plays the orders as dealt — Override or
    Transfer can legitimately beat the ceiling.
  - Balance band (via `scripts/balance.ts`): median lineup ≈ 24 wins, ceilings 49–50.
- `src/game/narrate.ts` — deterministic comedy debrief: season report, featured campaigns
  (incl. THE FINAL EXAM — the Gulf War closer), MVP / court-martial medals (units only),
  fatal flaw, era-clash beat.
- `src/game/share.ts` / `shareCard.ts` — emoji grid (5×10) share text + canvas-rendered
  1080×1350 dossier poster.
- `src/game/storage.ts` — localStorage (v2): one result per day, streaks, best record.

UI (`src/components/`): Title → Draft (3 candidates × 8 slots) → Roster review → Season
ticker (stamp slams, boss fights held on screen) → Debrief. Design system in
`src/styles.css` — declassified-dossier: paper, ink, rubber stamps, typewriter.

**Next up (see SCOPE.md):** the Requisition Wheel — RNG picks the category (ERA × SLOT),
the player picks the legend from a complete curated list. Era Override + Branch Transfer,
compatibility model, 2020s Commander pack (locked: default-on, satirical, commander cell
only, with an exclude toggle).

## Content policy

Objective-framed military problems; jokes punch at generals, logistics, and your own
army's dysfunction — never at victims. No active conflicts as scenarios (slate ends 1991),
no WMD mechanics, no atrocity content. Figures/organizations primarily associated with
genocide, crimes against humanity, or terror are ineligible (principles-first policy).
