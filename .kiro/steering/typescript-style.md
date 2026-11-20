# Steering — TypeScript Style

- Pure functions first: no I/O, no randomness, no wall-clock reads in the
  engine or rule packs; time and data are injected by callers.
- Zero runtime dependencies. Node's built-in test runner (`node:test`) and
  assertions for tests.
- Strict TypeScript: no implicit any, no unchecked indexed access without a
  guard, exact optional property types.
- Tests first for scoring and verdict logic; every label of every app has at
  least one unit test and one fixture.
- Deterministic ordering everywhere: sort by score desc, then id asc, so a
  verdict is byte-stable for identical inputs.
