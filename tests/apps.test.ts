import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../src/core/verdict.ts";
import type { ReleaseManifest } from "../src/apps/ship-or-noship.ts";
import { manifestToInput, shipOrNoShipPack } from "../src/apps/ship-or-noship.ts";
import type { ClaimPackage } from "../src/apps/claim-check.ts";
import { claimCheckPack, claimToInput } from "../src/apps/claim-check.ts";

const NOW = "2026-11-20T00:00:00Z";
const AT = "2026-11-19T10:00:00Z";

const baseManifest: ReleaseManifest = {
  releaseId: "v1",
  now: NOW,
  tickets: [{ id: "T-1", status: "done", at: AT }],
  prs: [{ id: "PR-1", state: "merged", at: AT }],
  builds: [{ id: "1", result: "success", at: AT }],
  blockers: [],
};

test("ShipOrNoShip: green build + merged PR + done tickets + resolved blocker => GO", () => {
  const manifest: ReleaseManifest = {
    ...baseManifest,
    blockers: [{ id: "B-1", title: "x", status: "resolved", at: AT }],
  };
  const v = evaluate(manifestToInput(manifest), shipOrNoShipPack);
  assert.equal(v.label, "GO");
  assert.equal(v.firm, true);
  assert.ok(v.citations.length >= 4);
});

test("ShipOrNoShip: open blocker is a hard veto => NO-GO", () => {
  const manifest: ReleaseManifest = {
    ...baseManifest,
    blockers: [{ id: "B-1", title: "corrupt totals", status: "open", at: AT }],
  };
  const v = evaluate(manifestToInput(manifest), shipOrNoShipPack);
  assert.equal(v.label, "NO-GO");
  assert.match(v.reasons.join(" "), /Hard veto/);
});

test("ShipOrNoShip: failed build is a hard veto => NO-GO", () => {
  const manifest: ReleaseManifest = { ...baseManifest, builds: [{ id: "2", result: "failure", at: AT }] };
  assert.equal(evaluate(manifestToInput(manifest), shipOrNoShipPack).label, "NO-GO");
});

test("ShipOrNoShip: no build evidence => CAUTION, never fake green", () => {
  const manifest: ReleaseManifest = { ...baseManifest, builds: [] };
  const v = evaluate(manifestToInput(manifest), shipOrNoShipPack);
  assert.equal(v.label, "CAUTION");
  assert.equal(v.firm, false);
  assert.match(v.gaps.join(" "), /no build evidence/);
});

test("ShipOrNoShip: open ticket downgrades a green release to CAUTION", () => {
  const manifest: ReleaseManifest = {
    ...baseManifest,
    tickets: [{ id: "T-9", status: "open", at: AT }],
    blockers: [{ id: "B-1", title: "x", status: "resolved", at: AT }],
  };
  assert.equal(evaluate(manifestToInput(manifest), shipOrNoShipPack).label, "CAUTION");
});

const material = (
  id: string,
  relation: "support" | "refute",
  authority: 1 | 2 | 3,
  sourceId = `src-${id}`,
) => ({
  id,
  sourceId,
  sourceLabel: `Label ${id}`,
  excerpt: `excerpt ${id}`,
  publishedAt: AT,
  authority,
  relation,
});

test("ClaimCheck: two independent supports, only a weak refutation => TRUE", () => {
  const pkg: ClaimPackage = {
    claim: "c",
    now: NOW,
    materials: [material("a", "support", 3), material("b", "support", 2), material("c", "refute", 1)],
  };
  const v = evaluate(claimToInput(pkg), claimCheckPack);
  assert.equal(v.label, "TRUE");
  assert.equal(v.firm, true);
});

test("ClaimCheck: two independent refutations incl. authority 3 => FALSE", () => {
  const pkg: ClaimPackage = {
    claim: "c",
    now: NOW,
    materials: [material("a", "refute", 3), material("b", "refute", 2), material("c", "support", 1)],
  };
  assert.equal(evaluate(claimToInput(pkg), claimCheckPack).label, "FALSE");
});

test("ClaimCheck: a single supporting source => UNVERIFIED with the gap spelled out", () => {
  const pkg: ClaimPackage = { claim: "c", now: NOW, materials: [material("a", "support", 3)] };
  const v = evaluate(claimToInput(pkg), claimCheckPack);
  assert.equal(v.label, "UNVERIFIED");
  assert.equal(v.firm, false);
  assert.match(v.gaps.join(" "), /TRUE needs 2/);
});

test("ClaimCheck: two items from the SAME source do not corroborate", () => {
  const pkg: ClaimPackage = {
    claim: "c",
    now: NOW,
    materials: [material("a", "support", 3, "one-source"), material("b", "support", 3, "one-source")],
  };
  assert.equal(evaluate(claimToInput(pkg), claimCheckPack).label, "UNVERIFIED");
});

test("ClaimCheck: low-authority refutations alone cannot kill a claim", () => {
  const pkg: ClaimPackage = {
    claim: "c",
    now: NOW,
    materials: [material("a", "refute", 1), material("b", "refute", 1)],
  };
  assert.equal(evaluate(claimToInput(pkg), claimCheckPack).label, "UNVERIFIED");
});
