# verdict-core — Design

Modules (one-way data flow, rule pack injected at the verdict step):

- `src/core/evidence.ts` — types + validation (R1, R5)
- `src/core/score.ts` — freshness decay + corroboration increments (R3)
- `src/core/verdict.ts` — evaluation assembly + citation gate (R2, R4, R6)
- `src/core/render.ts` — verdict-card data structure + static HTML page

Defaults live in the rule-pack/config layer, not the engine: half-life 72h,
corroboration increment 0.25 per additional independent source.
