// App 2 — ClaimCheck: claim verification verdicts.
// Derived from the verdict-core skeleton (inherits R1–R6). Input is a claim
// plus a set of source materials, each pre-labelled with its relation to the
// claim. Verdicts: TRUE / UNVERIFIED / FALSE. The FALSE bar is deliberately
// higher than the TRUE bar (guard against false kills):
//   - TRUE:  >= 2 independent supporting sources and no refutation of authority >= 2
//   - FALSE: >= 2 independent refuting sources, at least one of authority >= 2,
//            and refute score above support score
//   - anything else: UNVERIFIED, with the missing pieces listed as gaps

import type { EvaluationInput, EvidenceItem } from "../core/evidence.ts";
import type { RulePack } from "../core/verdict.ts";

export interface ClaimPackage {
  claim: string;
  now: string;
  materials: {
    id: string;
    sourceId: string;
    sourceLabel: string;
    excerpt: string;
    publishedAt: string;
    authority: 1 | 2 | 3;
    relation: "support" | "refute" | "unrelated";
  }[];
}

export function claimToInput(pkg: ClaimPackage): EvaluationInput {
  const evidence: EvidenceItem[] = [];
  for (const m of pkg.materials) {
    if (m.relation === "unrelated") continue;
    evidence.push({
      id: m.id,
      sourceId: m.sourceId,
      sourceLabel: m.sourceLabel,
      excerpt: m.excerpt,
      publishedAt: m.publishedAt,
      authority: m.authority,
      stance: m.relation,
    });
  }
  return { subject: pkg.claim, now: pkg.now, evidence };
}

export const claimCheckPack: RulePack = {
  app: "ClaimCheck",
  decide(ctx) {
    const reasons: string[] = [];
    const gaps: string[] = [];
    const strongRefute = ctx.scored.some((s) => s.stance === "refute" && s.authority >= 2);

    if (
      ctx.independentRefuteSources >= 2 &&
      strongRefute &&
      ctx.refuteScore > ctx.supportScore
    ) {
      reasons.push(
        `Refuted by ${ctx.independentRefuteSources} independent sources, at least one of authority >= 2`,
      );
      return { label: "FALSE", firm: true, reasons, gaps };
    }

    if (ctx.independentSupportSources >= 2 && !strongRefute && ctx.supportScore > ctx.refuteScore) {
      reasons.push(`Supported by ${ctx.independentSupportSources} independent sources, no strong refutation`);
      return { label: "TRUE", firm: true, reasons, gaps };
    }

    if (ctx.independentSupportSources < 2) {
      gaps.push(`only ${ctx.independentSupportSources} independent supporting source(s); TRUE needs 2`);
    }
    if (ctx.independentRefuteSources < 2 || !strongRefute) {
      gaps.push("refutation does not meet the FALSE bar (needs 2 independent sources, one of authority >= 2)");
    }
    if (strongRefute && ctx.independentSupportSources >= 2) {
      gaps.push("a refutation of authority >= 2 exists, so TRUE is blocked until it is resolved");
    }
    reasons.push("Evidence does not meet either firm threshold");
    return { label: "UNVERIFIED", firm: false, reasons, gaps };
  },
};
