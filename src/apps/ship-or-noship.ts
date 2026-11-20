// App 1 — ShipOrNoShip: release go/no-go verdicts.
// Derived from the verdict-core skeleton (inherits R1–R6). The adapter turns
// release signals into evidence items; the rule pack maps them to
// GO / CAUTION / NO-GO. Rule set mirrors the ReleaseGate rules that were
// validated in production use, re-implemented for this project:
//   - an open blocker or a failed latest build is a hard veto (NO-GO)
//   - no build evidence at all -> CAUTION (never fake green)
//   - a firm GO needs >= 2 independent supporting sources (spec R2)

import type { EvaluationInput, EvidenceItem } from "../core/evidence.ts";
import type { RulePack } from "../core/verdict.ts";

export interface ReleaseManifest {
  releaseId: string;
  now: string;
  tickets: { id: string; status: "done" | "open"; at: string }[];
  prs: { id: string; state: "merged" | "open" | "rejected"; at: string }[];
  builds: { id: string; result: "success" | "failure"; at: string }[];
  blockers: { id: string; title: string; status: "open" | "resolved"; at: string }[];
}

export function manifestToEvidence(manifest: ReleaseManifest): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  for (const build of manifest.builds) {
    items.push({
      id: `build-${build.id}`,
      sourceId: "ci-system",
      sourceLabel: `CI build ${build.id}`,
      excerpt: `Build ${build.id} finished with result: ${build.result}`,
      publishedAt: build.at,
      authority: 3,
      stance: build.result === "success" ? "support" : "refute",
    });
  }
  for (const blocker of manifest.blockers) {
    items.push({
      id: `blocker-${blocker.id}`,
      sourceId: "issue-tracker",
      sourceLabel: `Blocker ${blocker.id}`,
      excerpt: `Blocker ${blocker.id} "${blocker.title}" is ${blocker.status}`,
      publishedAt: blocker.at,
      authority: 3,
      stance: blocker.status === "open" ? "refute" : "support",
    });
  }
  for (const pr of manifest.prs) {
    items.push({
      id: `pr-${pr.id}`,
      sourceId: "code-review",
      sourceLabel: `Pull request ${pr.id}`,
      excerpt: `Pull request ${pr.id} is ${pr.state}`,
      publishedAt: pr.at,
      authority: 2,
      stance: pr.state === "merged" ? "support" : pr.state === "rejected" ? "refute" : "context",
    });
  }
  for (const ticket of manifest.tickets) {
    items.push({
      id: `ticket-${ticket.id}`,
      sourceId: "issue-tracker",
      sourceLabel: `Ticket ${ticket.id}`,
      excerpt: `Ticket ${ticket.id} is ${ticket.status}`,
      publishedAt: ticket.at,
      authority: 2,
      stance: ticket.status === "done" ? "support" : "context",
    });
  }
  return items;
}

export function manifestToInput(manifest: ReleaseManifest): EvaluationInput {
  return {
    subject: `Release ${manifest.releaseId}`,
    now: manifest.now,
    evidence: manifestToEvidence(manifest),
  };
}

export const shipOrNoShipPack: RulePack = {
  app: "ShipOrNoShip",
  decide(ctx) {
    const reasons: string[] = [];
    const gaps: string[] = [];

    const openBlocker = ctx.scored.find(
      (s) => s.id.startsWith("blocker-") && s.stance === "refute" && s.authority === 3,
    );
    const builds = ctx.scored.filter((s) => s.id.startsWith("build-"));
    const failedBuild = builds.find((s) => s.stance === "refute");

    if (openBlocker) reasons.push(`Hard veto: ${openBlocker.sourceLabel} is still open`);
    if (failedBuild) reasons.push(`Hard veto: ${failedBuild.sourceLabel} failed`);
    if (openBlocker || failedBuild) {
      return { label: "NO-GO", firm: true, reasons, gaps };
    }

    if (builds.length === 0) {
      gaps.push("no build evidence: a release with no CI result is never green");
      return { label: "CAUTION", firm: false, reasons: ["No build evidence on record"], gaps };
    }
    if (ctx.independentSupportSources < 2) {
      gaps.push(
        `only ${ctx.independentSupportSources} independent supporting source(s); a firm GO needs 2`,
      );
      return { label: "CAUTION", firm: false, reasons: ["Corroboration threshold not met"], gaps };
    }
    const openTickets = ctx.scored.filter((s) => s.id.startsWith("ticket-") && s.stance === "context");
    if (openTickets.length > 0) {
      reasons.push(`${openTickets.length} ticket(s) still open`);
      return { label: "CAUTION", firm: false, reasons, gaps };
    }

    reasons.push("No vetoes, build green, corroborated by >= 2 independent sources");
    return { label: "GO", firm: true, reasons, gaps };
  },
};
