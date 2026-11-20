# verdict-core — Requirements (skeleton spec)

This is the skeleton spec. Both app specs (ship-or-noship, claim-check)
declare derivation from this file and add only incremental requirements.

- R1 (Evidence model): WHEN an evidence item is recorded, the system SHALL
  store source identity, a verbatim excerpt, publication time, and an
  authority level (3 = official/first-hand, 2 = mainstream second-hand,
  1 = other). The verdict path SHALL NOT rewrite an excerpt.
- R2 (Corroboration threshold): WHEN the engine emits a firm verdict, that
  verdict SHALL be backed by at least 2 independent sources. WHEN fewer are
  available, the engine SHALL downgrade the verdict and name the gap.
- R3 (Scoring): The system SHALL score each item as authority x freshness
  (half-life decay, default 72h) x corroboration increment, and SHALL attach
  the total and per-item contributions to the verdict.
- R4 (Citation completeness): Every verdict SHALL carry per-item citations
  (source, excerpt, time, authority, contribution). A verdict with an
  incomplete citation SHALL be rejected by the citation gate before render.
- R5 (Purity): The engine SHALL have no I/O, no randomness, and no wall-clock
  reads; time is injected by the caller, so identical inputs always produce
  identical verdicts.
- R6 (Rule packs): Apps SHALL plug in as declarative rule packs (thresholds,
  signal weights, label mapping). The engine SHALL NOT contain any single
  app's business vocabulary.
