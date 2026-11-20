# ClaimCheck — Requirements

**Derivation**: inherits verdict-core R1–R6 in full. Incremental items only:

- B1: Input is one claim plus a material set; each material is labelled
  support / refute / unrelated with respect to the claim. Unrelated
  materials SHALL be excluded from evidence.
- B2: TRUE requires >= 2 independent supporting sources and no refutation
  of authority >= 2.
- B3: FALSE requires >= 2 independent refuting sources, at least one of
  authority >= 2, and a refute score above the support score. (The FALSE
  bar is deliberately higher than the TRUE bar — guard against false kills.)
- B4: Anything else is UNVERIFIED, and the verdict SHALL list exactly which
  threshold pieces are missing.
- B5: Output is a verdict card with excerpts shown next to the claim.
