# UNDEFEATED — The All-Time War Draft

**Play it live: https://nickciccone03-gif.github.io/undefeated/**

A daily parody war-draft game. Draft an army across 3,000 years of history — Genghis Khan
commanding the US Air Force, Sacred Geese on night watch — then march it through **all 50
of history's defining wars, in chronological order**, from the Hot Gates to the Gulf.
Can you go 50–0?

**Stack:** Vite + React + TypeScript. No backend, no APIs, no accounts. Fonts self-hosted
via Fontsource (Staatliches / Special Elite / IBM Plex Mono).

Product spec: [SCOPE.md](SCOPE.md) · Decision log: [DECISIONS.md](DECISIONS.md)

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
- `src/game/engine.ts` — scoring: weighted stats × commander multiplier + terrain +
  specials − anachronism tax (era spread, softened by commander adaptability), vs.
  per-war difficulty + shared daily "weather". Same picks ⇒ same record, globally.
  - `rankTeams` evaluates all 3⁸ = 6,561 possible drafts for "Army #982 of 6,561" and
    "BEST POSSIBLE TODAY".
  - **Daily ceilings vary by design.** Some boards allow 50–0, some cap at 47–3 — hard
    days are content, and the board is never rerolled to force perfection.
  - Balance targets (via `scripts/balance.ts`): median draft ≈ 36–14, bosses at 52–64%
    win rate, no war above 97% or below 3%.
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
