# VerdictKit

**No verdict without receipts.** VerdictKit is a skeleton (template) verdict
engine plus two apps derived from it. Every firm conclusion must be backed
by at least two independent sources, quoted verbatim, scored by authority
and freshness — or the engine downgrades itself and names the missing
evidence instead of guessing.

## Structure

```
src/core/    verdict-core: evidence model, scoring, verdict assembly, card render
src/apps/    ShipOrNoShip (release go/no-go) · ClaimCheck (claim verification)
fixtures/    sample inputs: GO / NO-GO manifests, TRUE / FALSE claim packages
.kiro/       specs (1 skeleton + 2 derived) · steering (methodology, citation
             format, TS style) · hooks (v1 JSON, see .kiro/hooks/README.md)
out/         generated verdict cards (npm run demo)
```

Both apps are thin rule packs over the same engine — that is the Skeleton
Crew point: one spec, one steering set, two working apps.

## Run

```bash
npm test            # unit tests (node:test, zero dependencies)
npm run demo        # writes out/cards.json + out/verdict-cards.html
npm run lint:citations   # R4 gate over the generated verdicts
```

## Built with Kiro

VerdictKit was built spec-first in Kiro:

- **Specs** — `.kiro/specs/` holds requirements / design / tasks for the
  verdict-core skeleton and for each derived app (ShipOrNoShip, ClaimCheck).
- **Steering** — `.kiro/steering/` pins the verdict methodology, the
  citation format, and the TypeScript style the code follows.
- **Hooks** — `.kiro/hooks/` holds three hooks in the Kiro v1 JSON schema
  (shared by Kiro IDE 1.0 and Kiro CLI 3.x): `test-on-save` runs the unit
  tests when the agent saves a `src/*.ts` file, `citation-lint` enforces
  the R4 citation-integrity gate when fixtures or verdict output change,
  and `fixture-refresh` regenerates the demo cards and re-runs the suite
  when verdict-core changes. Details and verification status:
  `.kiro/hooks/README.md`.

## Rules of the house

- Firm verdicts need >= 2 independent sources (same source twice = once).
- Excerpts are verbatim; freshness decays with a 72h half-life; authority is
  3 (official) / 2 (mainstream) / 1 (other).
- ShipOrNoShip: an open blocker or failed build is a hard NO-GO; no build
  evidence means CAUTION, never a fake green.
- ClaimCheck: the FALSE bar is higher than the TRUE bar, on purpose.

MIT licensed.
