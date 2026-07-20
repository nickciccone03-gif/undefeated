# UNDEFEATED — The All-Time War Draft

A daily parody war-draft game. Draft an army across 3,000 years of history — Genghis Khan
commanding the US Air Force, Sacred Geese on night watch — then fight an 82-war season and
try to go undefeated.

**Stack:** Vite + React + TypeScript. No backend, no APIs, no accounts. Fonts self-hosted
via Fontsource (Staatliches / Special Elite / IBM Plex Mono).

```bash
npm install
npm run dev        # play at http://localhost:5173
npm run build      # production build → dist/
npx tsx scripts/balance.ts   # engine balance report
```

## How it works

Everything is **deterministic per local calendar day**:

- `src/game/rng.ts` — seeded PRNG (mulberry32). Day seed = hash of `YYYY-MM-DD`.
- `src/game/roster.ts` — the draft pool: 80 picks across 8 slots, each with 7 stats,
  era year, terrain affinities, a special rule, and bespoke joke lines. **This file is the
  product.** Add content here.
- `src/game/campaigns.ts` — 24 campaign archetypes + name variants + comedy enemy factions.
  The daily schedule expands these into 82 wars.
- `src/game/engine.ts` — scoring: weighted stats × commander multiplier + terrain +
  specials − **anachronism tax** (era spread, softened by commander adaptability), vs.
  per-war difficulty + shared "weather" noise. Same picks ⇒ same record, globally, so
  records are comparable and arguments are settleable.
  - `rankTeams` evaluates **all 3⁸ = 6,561 possible teams** from the day's board to produce
    "Army #982 of 6,561", best-possible-today, and the count of perfect drafts.
  - Balance constants live in `BAL`, tuned via `scripts/balance.ts`
    (targets: median army ≈ 59 wins, best ≈ 80, perfect seasons possible ~1 day in 3 for a
    handful of drafts).
- `src/game/narrate.ts` — deterministic comedy debrief: season report, featured campaigns,
  MVP / court-martial medals (units only), fatal flaw, era-clash beat.
- `src/game/share.ts` / `shareCard.ts` — Wordle-style emoji share text + canvas-rendered
  1080×1350 dossier poster PNG.
- `src/game/storage.ts` — localStorage: one result per day, streaks, best record.

UI (`src/components/`): Title → Draft (3 candidates × 8 slots) → Roster review (swap any
slot) → Season ticker (stamp slams, grudge matches) → Debrief. Design system in
`src/styles.css` — declassified-dossier aesthetic: paper, ink, rubber stamps, typewriter.

## Content policy

Parody register: mythologized, long-past, or celebratory picks only. No 20th-century
genocidal figures, no extremist organizations, no active conflicts, no atrocity content,
no civilian anything. Punch at generals and logistics, never at victims.

## Roadmap ideas

- Serverless daily leaderboard + global "today's distribution" histogram
- AI-written debrief variant layered on the deterministic engine output
- OG image endpoint so shared links preview the poster
- More pools (Siege Engineers, Propaganda Corps, Naval Aviation, Weather)
- "Museum of Defeats" — hall of fame for worst seasons
