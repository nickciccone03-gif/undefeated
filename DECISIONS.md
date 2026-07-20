# Decision Log

Format: date · decision · who · rejected alternatives · why.

**2026-07-20 · 50-war named historical slate replaces 24 abstract archetypes** · owner+builder
· Rejected: 82 abstract wars with fake enemies. · Named wars ("my army lost NORMANDY") are
the better screenshot; objective framing ("establish and supply a beachhead") solves the
"defeat <population>" tone problem; theater-split WWII. Tone swaps: Winter War, Chaco,
Great Northern, Anglo-Zulu (defender) in; 1857 Rebellion, Soviet–Afghan, Indo-Pak '71,
Second Sino-Japanese out.

**2026-07-20 · Requisition Wheel (RNG picks category, player picks legend)** · owner
· Rejected: 3-random-candidates draft. · 82-0.com Classic verified: spin → (constraint) →
exhaustive stat-visible list → free pick. Agency creates attachment and blame.

**2026-07-20 · No Overall rating** · reviewer, conceded by builder · Rejected: sortable
composite. · Flattens drafting to "87>84"; editorial landmine on living figures.

**2026-07-20 · Stats visible is the default; hidden mode ships at launch as toggle** ·
builder, upheld over reviewer's hidden-default · Casual players know less military history
than NBA fans know basketball; blind-by-default punishes the mainstream. 82-0's own default
is Classic.

**2026-07-20 · No perfect-season reroll; variable daily ceilings** · reviewer, conceded by
builder (reverses earlier adoption) · Rerolling until 50–0 exists would suppress the
funniest boards (ANTIQUITY × AIR). Ceiling + distance is the honest, better content.
Guarantee made sense for fixed-candidate boards; the wheel changed the calculus.

**2026-07-20 · Blanket era tax → 3-rule compatibility model** · synthesis · Rejected:
√(spread) tax (taxes the premise); rejected: 5-subsystem simulation (scope). C2 penalty must
be mitigation-driven (commander adaptability, Intel bridging, doctrine specials), not
renamed date arithmetic.

**2026-07-20 · Era Override + Branch Transfer as the strategy layer** · reviewer, adopted ·
One-slot-per-spin with free choice is 8 independent argmaxes; these add opportunity cost
while staying deterministic and comparable (predefined alternates; transfer re-opens the
vacated slot under its original order).

**2026-07-20 · Living leaders: core roster, DEFAULT-ON, day one — FINAL (owner)** ·
owner, overruling reviewer's "scheduled Current Affairs event post-launch" · Commander cell
only; "Exclude current leaders" toggle; eligibility = held office during decade; sharp
realistic satire, equal-opportunity, internally consistent stats; rubric hard lines
(health/family/ethnicity/coercion/casualties) stand; atrocity-figure exclusions are NOT a
general political-sensitivity filter. Owner accepts the discourse risk explicitly.

**2026-07-20 · Phase 1a proves the loop on ~20 active cells before content expansion** ·
reviewer refinement of builder's 1a · 80 cards can't fill 80 cells; ≥4 real choices per
active cell or the draft isn't a draft. Hard behavioral gate before 1b's ~300 cards.

**2026-07-20 · Runtime board derivation (no shipped manifest)** · builder, upheld with
reviewer's framing · Chosen for liveness (game survives missed deploys), NOT secrecy —
static clients are minable regardless. CI validates future boards and precomputes ceilings.

**2026-07-20 · Versioned challenge identity** · reviewer, adopted · date+boardSeed+ruleset+
roster+scenario versions pinned in results and links; balance patches never silently
rewrite old records. Local-date day keying (Wordle convention) documented.

**2026-07-20 · "Exhaustive" → "complete curated roster for this ruleset"** · reviewer,
conceded · Unwinnable completeness arguments; felt-exhaustiveness for famous figures
remains the experience goal. Taxonomy, voice, dailies are the moat — not row count.

**2026-07-20 · Authenticity ≠ ruleset ≠ tone (three schema fields)** · reviewer, adopted ·
A living figure is real; the treatment is satirical. Conflating them breaks filtering.

**2026-07-20 · Sealed-record screen: one fixed line, no bespoke punchlines** · reviewer,
adopted · Bespoke jokes would make excluded-monster searching collectible content.

**2026-07-20 · Real cards only — no fictional units, no UI badges** · owner ·
Rejected: invented/mythical comedy cards (Icarus Program, The Group Chat, Trojan Horse,
General Winter, Tesla's Death Ray, Da Vinci's Ornithopter, the legendary Beacon Chain) and
the SATIRE/authenticity badges ("dumb"). · The game's magic trick is "this really
happened" — the Emu War standard. All seven cut; replaced with attested absurdities:
Hannibal's Snake Pots (Justin/Nepos), US Space Force, the Polybius fire-signal telegraph
(Histories X), the Olympic Pigeon Dispatch (Aelian), Caesar's Speculatores. Authenticity
stays as a schema field for editorial control; it never renders in UI.

**2026-07-20 · Distinct eras per board** · owner (caught 4×ANTIQUITY in live play) ·
buildOrders now deals a seeded perfect matching — 8 slots, 8 different eras, same board
for everyone; graceful repeat-fallback only if a future cell config makes matching
impossible. CI lint asserts distinctness on sampled boards. Side effect at 1a: every board
is a full rainbow, so a 50–0 lineup exists daily until 1b widens the era pool.

**2026-07-20 · Scoring v3: seat emphasis + C2 as a staff-work delta; shared kernel + CI
parity gate** · builder, measured via enumeration probe · Rejected: flat 1/8 seat
contribution (a navy's stats counted the same in a desert war as a naval one; the worst
air pick cost 2.2 wins while the worst logistics cost 19) and C2 as a near-constant tax
(SD 0.14 across lineups — rainbow boards fix the era spread, so √spread had become the
date arithmetic the model was built to avoid). Now: each war weights the seats it is
about (`slotEmphasisOf`, tags/tests-derived, card-overridable via `slotWeights`); C2
pays/earns the delta between your staff (commander adaptability, Intel INT, new `bridge`
field on 8 comms cards — GPS, Yam network, Bletchley, Polybius Telegraph, pigeons ×2,
Speculatores, Space Force) and a reference staff. One shared `warScore` kernel feeds both
simulate and enumerate, with a CI parity gate (`scripts/parity.ts`) so ARMY #/ceiling can
never drift from the season the player watched. `difficultyShift` retuned −0.22 → 0.9;
band restored (avg median 23.6, ceilings 50×20/49×4 over 24 sampled days; naive-vs-optimal
gap widened 1.7 → 2.8 wins). RULESET_VERSION 2 → 3 — old records archived, never
recomputed. Correction to the rainbow-board note above: a 50–0 lineup exists on ~20 of 24
sampled boards, not daily; "COMMAND HQ CEILING" (orders as dealt) replaces "BEST POSSIBLE
TODAY" in the debrief, since Override/Transfer can legitimately beat it.
