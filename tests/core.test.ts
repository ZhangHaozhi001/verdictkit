import assert from "node:assert/strict";
import { test } from "node:test";
import type { EvidenceItem } from "../src/core/evidence.ts";
import { freshnessAt, scoreEvidence } from "../src/core/score.ts";
import { assertCitationComplete, evaluate } from "../src/core/verdict.ts";
import type { RulePack } from "../src/core/verdict.ts";

const NOW = "2026-11-20T00:00:00Z";
const ev = (partial: Partial<EvidenceItem> & { id: string }): EvidenceItem => ({
  sourceId: `src-${partial.id}`,
  sourceLabel: `Source ${partial.id}`,
  excerpt: `excerpt ${partial.id}`,
  publishedAt: NOW,
  authority: 2,
  stance: "support",
  ...partial,
});

test("freshness halves at the 72h half-life and never exceeds 1", () => {
  assert.equal(freshnessAt(NOW, NOW, 72), 1);
  assert.equal(freshnessAt("2026-11-17T00:00:00Z", NOW, 72), 0.5);
  assert.equal(freshnessAt("2026-11-23T00:00:00Z", NOW, 72), 1); // future-dated clamps to 1
});

test("corroboration: a second independent source earns the increment, a repeat source does not", () => {
  const scored = scoreEvidence(
    [ev({ id: "a", authority: 2 }), ev({ id: "b", authority: 2 }), ev({ id: "c", authority: 2, sourceId: "src-a" })],
    NOW,
  );
  const byId = new Map(scored.map((s) => [s.id, s.contribution]));
  // a and b are independent: one of them gets base 2, the other 2 * 1.25.
  // c repeats a's source: no increment beyond what its source already earned.
  const values = [...byId.values()].sort((x, y) => x - y);
  assert.deepEqual(values, [2, 2, 2.5]);
});

test("evaluate is a pure function: same input, same verdict", () => {
  const pack: RulePack = {
    app: "TestApp",
    decide: (ctx) => ({
      label: ctx.independentSupportSources >= 2 ? "YES" : "UNVERIFIED",
      firm: ctx.independentSupportSources >= 2,
      reasons: [],
      gaps: [],
    }),
  };
  const input = { subject: "s", now: NOW, evidence: [ev({ id: "a" }), ev({ id: "b" })] };
  assert.deepEqual(evaluate(input, pack), evaluate(input, pack));
});

test("citation gate rejects a verdict whose citation lost a field", () => {
  const pack: RulePack = { app: "T", decide: () => ({ label: "X", firm: true, reasons: [], gaps: [] }) };
  const verdict = evaluate({ subject: "s", now: NOW, evidence: [ev({ id: "a" })] }, pack);
  const broken = structuredClone(verdict);
  (broken.citations[0] as unknown as Record<string, unknown>)["excerpt"] = "";
  assert.throws(() => assertCitationComplete(broken), /excerpt/);
});

test("validation rejects empty excerpts and duplicate ids", () => {
  const pack: RulePack = { app: "T", decide: () => ({ label: "X", firm: true, reasons: [], gaps: [] }) };
  assert.throws(
    () => evaluate({ subject: "s", now: NOW, evidence: [ev({ id: "a", excerpt: "" })] }, pack),
    /excerpt/,
  );
  assert.throws(
    () => evaluate({ subject: "s", now: NOW, evidence: [ev({ id: "a" }), ev({ id: "a" })] }, pack),
    /duplicate/,
  );
});
