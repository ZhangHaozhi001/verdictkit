// verdict-core — verdict assembly (spec R2, R4, R6).
// Apps plug in as declarative rule packs; the engine itself contains no
// app-specific vocabulary. Every verdict carries full citations or it
// does not leave the engine (assertCitationComplete is the R4 gate).

import type { EvaluationInput } from "./evidence.ts";
import { validateInput } from "./evidence.ts";
import type { ScoredEvidence, ScoreConfig } from "./score.ts";
import { DEFAULT_SCORE_CONFIG, distinctSources, scoreEvidence, stanceScore } from "./score.ts";

export interface Citation {
  evidenceId: string;
  sourceId: string;
  sourceLabel: string;
  excerpt: string;
  publishedAt: string;
  authority: number;
  stance: string;
  contribution: number;
}

export interface Verdict {
  app: string;
  subject: string;
  label: string;
  /** True when the label is a firm verdict; false when downgraded (spec R2). */
  firm: boolean;
  evaluatedAt: string;
  supportScore: number;
  refuteScore: number;
  independentSupportSources: number;
  independentRefuteSources: number;
  reasons: string[];
  /** What is missing when the verdict had to be downgraded. */
  gaps: string[];
  citations: Citation[];
}

export interface RuleContext {
  scored: ScoredEvidence[];
  supportScore: number;
  refuteScore: number;
  independentSupportSources: number;
  independentRefuteSources: number;
}

export interface RuleDecision {
  label: string;
  firm: boolean;
  reasons: string[];
  gaps: string[];
}

export interface RulePack {
  app: string;
  decide(ctx: RuleContext): RuleDecision;
}

const CITATION_FIELDS: (keyof Citation)[] = [
  "evidenceId",
  "sourceId",
  "sourceLabel",
  "excerpt",
  "publishedAt",
  "authority",
  "stance",
  "contribution",
];

/** Spec R4 gate: a verdict with any incomplete citation must never render. */
export function assertCitationComplete(verdict: Verdict): void {
  if (!verdict.label) throw new Error("verdict.label is missing");
  for (const citation of verdict.citations) {
    for (const field of CITATION_FIELDS) {
      const value = citation[field];
      if (value === undefined || value === null || value === "") {
        throw new Error(`citation ${citation.evidenceId ?? "?"}: field ${field} is missing`);
      }
    }
  }
}

export function evaluate(
  input: EvaluationInput,
  pack: RulePack,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): Verdict {
  validateInput(input);
  const scored = scoreEvidence(input.evidence, input.now, config);
  const ctx: RuleContext = {
    scored,
    supportScore: stanceScore(scored, "support"),
    refuteScore: stanceScore(scored, "refute"),
    independentSupportSources: distinctSources(scored, "support"),
    independentRefuteSources: distinctSources(scored, "refute"),
  };
  const decision = pack.decide(ctx);
  const verdict: Verdict = {
    app: pack.app,
    subject: input.subject,
    label: decision.label,
    firm: decision.firm,
    evaluatedAt: input.now,
    supportScore: ctx.supportScore,
    refuteScore: ctx.refuteScore,
    independentSupportSources: ctx.independentSupportSources,
    independentRefuteSources: ctx.independentRefuteSources,
    reasons: decision.reasons,
    gaps: decision.gaps,
    citations: scored.map((s) => ({
      evidenceId: s.id,
      sourceId: s.sourceId,
      sourceLabel: s.sourceLabel,
      excerpt: s.excerpt,
      publishedAt: s.publishedAt,
      authority: s.authority,
      stance: s.stance,
      contribution: s.contribution,
    })),
  };
  assertCitationComplete(verdict);
  return verdict;
}
