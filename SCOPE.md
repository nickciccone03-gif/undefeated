# UNDEFEATED 2.0 — The Requisition Wheel — Executable Spec (v3)

*Final decisions only. Rationale and rejected alternatives live in [DECISIONS.md](DECISIONS.md).*

**Thesis: The RNG picks the category. The player picks the legend.**

## Core loop

Eight rounds. Each round reveals a daily-seeded **REQUISITION ORDER** — (ERA × SLOT) — then
the player drafts anyone from that cell's complete curated list. Eight picks → the 50-war
chronological season (scenarios ≤1991, never active conflicts) → debrief → share. Everyone
gets the same orders in the same sequence per local calendar day (Wordle convention).

## Eras (10)

Antiquity (to 500) · Medieval (500–1450) · Gunpowder (1450–1700) · Age of Sail & Empire
(1700–1850) · Industrial Warfare (1850–1914) · WWI & Interwar (1914–1938) · World War II
(1939–1945) · Cold War (1946–1991) · Post-Cold War (1992–2019) · The 2020s.
Uniform era weighting on the wheel (2020s × Commander ≈ 1 day in 10, by natural math).

## Strategy resources (shared, deterministic, 1/day each)

- **Era Override:** reroll the current order's era to that slot's predefined daily alternate.
- **Branch Transfer:** fill an arriving order with an eligible earlier dual-slot pick
  (`slots: [primary, secondary?]`), then immediately re-draft the vacated slot under its
  original order.

## Stats & modes

- Seven attributes as bars. **No Overall rating exists anywhere.**
- Sort by attribute / year / nation / name; search; no virtualization (≤ ~30 rows).
- Collapsed row: name, year, nation, two strengths, one warning. Expanded: full dossier.
- Default daily: stats visible. **Field Promotion mode** (stats hidden, own share badge)
  ships at launch as a toggle.

## Compatibility model (no blanket era tax) — ruleset v3

**SEAT EMPHASIS** — each war weights the seats it is about (naval wars listen to the navy
chair, sieges to armor/ground); derived from the card's tags/tests, card-overridable via
`slotWeights`. Whoever occupies the seat (Branch Transfer included) carries the weight.

Three named rules, each with a generated debrief sentence:

1. **SUSTAINMENT** — Logistics pick's era/tech vs. hungriest units, scaled by scenario
   logistics weight. Supply runs on the Logistics pick's TECH (hinted in the draft UI).
2. **COMMAND & CONTROL** — era spread sets the *stakes* (board-fixed on rainbow boards);
   what you pay or earn is the *delta* between your staff work — commander adaptability,
   Intelligence INT, doctrine-bridge picks (`bridge` field: GPS, the Yam network,
   Bletchley, the Polybius Telegraph…) — and a reference staff. Great glue is a bonus,
   not a smaller tax. Integration, not date arithmetic.
3. **BASING** — air/naval picks vs. scenario infrastructure, applied only where the
   scenario makes it relevant (folded into SUSTAINMENT demand).

## Cards

- Scale declared per slot (commander = individual at snapshot year; unit = force package at
  snapshot year). Long-lived forces get one card per era version.
- Schema fields: `id, name, nation, snapshotYear, era, slots[], stats(7), terrain, special,
  bridge (doctrine/comms glue, 0–2, rare), authenticity(historical|experimental|legendary|improvised),
  ruleset(core|current-affairs|special-event), tone(documentary|comedic|satirical),
  version, sourceNote, editorialStatus` — schema-validated data, generated types.
- Ratings are era-relative — 5 = competent for its day, 8+ = attested era-best, 1–3 =
  famous documented weakness; [RATINGS.md](RATINGS.md) is the stat source of truth.
  Cross-era viability comes from scenario weights, compatibility, and specials.
- **Real cards only (owner rule):** every card is an attested unit, system, institution, or
  event — the Emu War standard. No mythical or invented cards; the joke is that it really
  happened (Sacred Chickens, Snake Pots, Space Force). The authenticity field stays in the
  schema for editorial control but never renders in the UI — no badges of any kind.

## Living leaders — LOCKED (owner decision, final)

- 2020s heads of state are **in the core roster, default-on, day one**, Commander cell
  only. Settings toggle: "Exclude current leaders."
- Eligibility: held qualifying office during the decade (roster survives elections).
- Ratings: sharp, realistic, internally consistent satire of public leadership record —
  harsh, flattering, or embarrassing as earned; nobody protected; no partisan cheerleading;
  equal treatment ≠ identical treatment. Humor lives in stat labels, specials, weaknesses,
  and debrief lines. Register: ruthless sports rating, not civics textbook.
- Rubric (hard lines): no health/disability, family, ethnicity/nationality/religion,
  assassination, real-casualty, imprisonment/torture/coercion, or current-battlefield-loss
  jokes. Persona, record, communications, administration, and alternate-history outcomes
  are all fair game.
- Active-war field commanders excluded. Atrocity-centered figures/organizations excluded
  per policy (principles-first; internal ID list implements it). Excluded-name search
  returns one fixed line: `RECORD SEALED UNDER ROSTER POLICY.`

## Daily boards, ceilings, versioning

- Boards derive from the local date at runtime; the game never dies of a missed deploy.
- **No perfect-season reroll.** Ceilings vary by day and are content: "DAILY CEILING: 47–3.
  You finished two wins off Command HQ." Optimal lineup revealed only after the day rolls.
- CI validates future boards (cell coverage, pool sanity) and precomputes ceilings.
- Challenge identity = `challengeDate + boardSeed + rulesetVersion + rosterVersion +
  scenarioVersion`; results and share links pin it; old links render badged, never silently
  recomputed.

## Phase plan

- **Phase 0** — finish + deploy the 50-war slate migration on the current 3-candidate
  draft. (In progress.)
- **Phase 1a** — prove the wheel with existing content: schema v2 + retag 80 picks;
  ~20 active (era × slot) cells with ≥4 choices each (~20–30 filler cards; strong, weak,
  and absurd cells); wheel UI; Override + Transfer; compatibility model v1; Field Promotion
  toggle; versioned identity; 2020s Commander starter pack (locked scope above). Inactive
  cells disabled until 1b. Portrait-first.
- **GATE** — observed playtests must show: candidate comparison, explainable tradeoffs,
  deliberate Override/Transfer use, debrief tied to remembered decisions, voluntary
  replay/share. Sort-by-Firepower×8 = stop and redesign, not more cards.
- **Phase 1b** — expand toward ~300 cards (cell minimum: 3 verified or labeled fallback
  pool; ~50 marquee bespoke copy), full matrix activation, remaining polish.
- **Deferred** — Monte Carlo percentile, archetype line-generator, nation-locked modes,
  1v1 links, leaderboards, 650-card depth.
