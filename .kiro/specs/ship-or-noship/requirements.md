# ShipOrNoShip — Requirements

**Derivation**: inherits verdict-core R1–R6 in full. Incremental items only:

- A1: Input is a release manifest (ticket states, PR states, build results,
  blockers). An adapter SHALL convert each signal class into evidence items
  (build result = CI system, authority 3; blocker = issue tracker,
  authority 3; PR = code review, authority 2; ticket = issue tracker,
  authority 2).
- A2: An open blocker or a failed build SHALL be a hard veto (NO-GO).
- A3: A release with no build evidence SHALL be CAUTION, never GO.
- A4: Open tickets SHALL downgrade an otherwise-green release to CAUTION.
- A5: Output is a verdict card (terminal/JSON + the shared static page).
