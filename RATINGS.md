# RATINGS.md — The Stat Rubric (Source of Truth)

Every card's seven stats follow this document. If a number in `roster.ts` / `roster2.ts`
disagrees with this rubric, one of them is wrong — fix it here first, then in the data.
Read this before adding or re-rating **any** card.

## The scale: era-relative, 1–10

A stat measures how good the unit was at that dimension **relative to its own era's
standards** — never against the whole timeline. A trebuchet can out-TECH a 1905 fleet;
Winged Hussars carry FIRE 10 because nothing in 1683 hit harder, not because a lance
outguns an Abrams. Cross-era matchups are the engine's job (scenario weights,
compatibility, specials), not the stats'.

| Value | Meaning |
| --- | --- |
| 9–10 | Era-defining, historically attested excellence — the textbook example |
| 7–8 | Notably excellent for its day |
| 5–6 | Competent professional standard of the era |
| 3–4 | Below standard; a real limitation |
| 1–2 | Famous documented weakness, or the capability essentially absent |

**The audit test:** every number must survive a history nerd asking "why?" with a
concrete, sourceable answer. The blurbs and lines carry the jokes; the numbers tell
the truth. When reputation and record disagree, the record wins and the blurb gets
the reputation ("the numbers argue back").

## The seven stats

- **atk / FIRE** — offensive shock and striking power. *10: Winged Hussars' charge,
  Royal Navy broadside, Great Bombard, USAF '91.*
- **def / DEF** — protection, staying power, holding ground. *10: Turtle Ships, M1
  Abrams. 3: Boudica's horde at Watling Street (no reserve, no escape route).*
- **mob / MOB** — operational + tactical mobility. *10: Mongol horse archers, Air Cav
  Hueys, SR-71. 2: the Baltic Fleet, tactically.*
- **log / LOG** — sustainment on campaign. *10: Roman roads, Liberty Shipyards,
  Venetian Arsenal, Berlin Airlift. 2: Boudica (the horde starved mid-campaign).*
- **tech / TECH** — sophistication **against era peers**. Keep pre-industrial era-apex
  at ≤8 (9 for singular outliers like Archimedes): the sustainment model also reads
  TECH as a cross-era supply-demand proxy, so headroom matters. *8: Great Bombard in
  1453, turtle ships in 1597. 10: Abrams, U-2, GPS.*
- **grit / MRLE** — cohesion, discipline, will to fight. *10: Spartans, Gurkhas,
  Tuskegee escort record. 7 not 8 for the Janissaries: elite, and mutiny-prone —
  the payroll joke is real history.*
- **int / INTL** — recon, espionage, signals, battlefield awareness. *10: Bletchley,
  Navajo Code Talkers, Walsingham. Not automatically low for ancients: Genghis ran
  merchant-spy networks (9); Hannibal's ambushes were recon products (9).*

## Authoring a new card

1. **Shape first.** From the historical record, pick the 1–2 famous strengths (8–10)
   and the 1–2 documented weaknesses (1–4). The silhouette should be recognizable to
   someone who knows the unit.
2. **Amplitude second.** Fill the middle stats at 4–7 against the era-peer standard.
   Justify every number ≥8 and ≤3 with a fact you could cite.
3. **Audit both directions.** Realism cuts down as often as up — check for
   reputation-inflation (grit is the roster's most inflated stat) before shipping.
4. **Budget.** Roster totals: mean ≈ 41.5, p25 36 / median 41 / p75 49. Typical cards
   land 33–50. Outliers must be the joke *and* the history (Baltic Fleet 24,
   USAF '91 58).
5. **Cell check.** Every active (era × slot) cell needs ≥4 real choices and no pick
   that strictly dominates the cell — differentiate roles via terrain, specials, and
   stat shape, not just totals.
6. **Avoid gratuitous bottom-ties.** The draft row shows one warning chip (single
   worst stat; display ties resolve toward INTL), so differentiate the low stats
   when history supports it.
7. **Lint.** `npm run balance` must pass and the band must hold (see below).

## Exceptions

- **`ruleset: 'current-affairs'` (2020s living figures):** numbers are sharp satire
  with an internally consistent rationale, governed by the living-figure rubric in
  `roster2.ts` and the owner decisions in DECISIONS.md — not by the era-relative
  audit test. Do not "realism-pass" these cards.
- **Attested-absurdity cards** (Sacred Geese, Emus, War Pigs, Sacred Chickens, the
  Oracle…): rated as what they literally were. The Emu War numbers are the citation.

## Balance band (the numbers this roster is tuned to)

Measured by `scripts/balance.ts` on 24 sampled daily boards, scoring v3
(RULESET_VERSION 3), `difficultyShift: 1.2`, ROSTER_VERSION 4:

- avg optimal-play median ≈ 23.5, avg ceiling ≈ 49.7
- ceiling distribution ≈ 50×16 · 49×8
- perfect-possible days ≈ 16/24 (the realism pass compressed the top-vs-field
  spread; fewer guaranteed-perfect days is accepted content per the
  variable-ceilings decision)

If a stat change moves these materially, either the change is wrong or
`difficultyShift` needs re-centering — decide explicitly, never drift silently.

## Change control — scoring and ratings move together

The stats are inputs to the engine's scoring kernel. **If you touch either side,
you own both sides:**

- Touching **engine scoring** (`warScore`/weights/seat emphasis, `BAL.*`, the
  compatibility model) → re-run `npm run balance` (and the parity gate, once
  merged), re-center `BAL.difficultyShift` to the band above, and update this
  file's budget + band numbers to the new measurements.
- Touching **card stats** → same loop, plus bump `ROSTER_VERSION` (records are
  versioned; old scores archive rather than silently recompute — see the
  versioned-challenge-identity decision in DECISIONS.md).
- Either way → log the change in DECISIONS.md.

Provenance note: the band above was calibrated 2026-07-20 on scoring v3 after the
merge (difficultyShift 0.9 → 1.2 for the stronger roster). The parity gate
(`scripts/parity.ts`) must pass alongside balance whenever either side moves.

## Changelog

- **2026-07-20 — v1.** Rubric codified; realism pass across 57 cards (44 raises,
  13 downward corrections). Killed the half-applied absolute scale that dumped
  TECH/INTL on every pre-modern card (worst-chip share: −TECH 31%→23%, −INTL
  30%→30% but now strict-lowest rather than tie artifacts, −FIRE 16%→18%, −LOG
  12%→14%). Bridge-field cards (GPS, Yam, Bletchley, Polybius, both pigeon corps,
  Speculatores, Space Force) left untouched through the scoring-v3 merge.
  Recalibrated on v3 post-merge: difficultyShift 0.9 → 1.2, ROSTER_VERSION 4.
