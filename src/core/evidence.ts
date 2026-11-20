// verdict-core — evidence model (spec R1, R5).
// Pure types + validation. No I/O, no clock reads: time is always injected.

export type Authority = 1 | 2 | 3; // 3 = official / first-hand, 2 = mainstream second-hand, 1 = other
export type Stance = "support" | "refute" | "context";

export interface EvidenceItem {
  /** Stable id within one evaluation. */
  id: string;
  /** Independent-source identity: two items with the same sourceId are NOT independent. */
  sourceId: string;
  /** Human-readable source label, printed on the verdict card. */
  sourceLabel: string;
  /** Verbatim excerpt. The engine never rewrites this (spec R1). */
  excerpt: string;
  /** ISO-8601 timestamp of when the source was published/observed. */
  publishedAt: string;
  authority: Authority;
  stance: Stance;
}

export interface EvaluationInput {
  /** What is being judged (a release id, a claim text, ...). */
  subject: string;
  evidence: EvidenceItem[];
  /** Injected "now" (ISO-8601). The engine never reads the wall clock (spec R5). */
  now: string;
}

const AUTHORITIES: ReadonlySet<number> = new Set([1, 2, 3]);
const STANCES: ReadonlySet<string> = new Set(["support", "refute", "context"]);

export function validateEvidence(item: EvidenceItem): void {
  if (!item.id) throw new Error("evidence.id is required");
  if (!item.sourceId) throw new Error(`evidence ${item.id}: sourceId is required`);
  if (!item.sourceLabel) throw new Error(`evidence ${item.id}: sourceLabel is required`);
  if (!item.excerpt) throw new Error(`evidence ${item.id}: excerpt is required (verbatim, never empty)`);
  if (Number.isNaN(Date.parse(item.publishedAt))) {
    throw new Error(`evidence ${item.id}: publishedAt is not a valid timestamp`);
  }
  if (!AUTHORITIES.has(item.authority)) {
    throw new Error(`evidence ${item.id}: authority must be 1, 2 or 3`);
  }
  if (!STANCES.has(item.stance)) {
    throw new Error(`evidence ${item.id}: stance must be support | refute | context`);
  }
}

export function validateInput(input: EvaluationInput): void {
  if (!input.subject) throw new Error("input.subject is required");
  if (Number.isNaN(Date.parse(input.now))) throw new Error("input.now is not a valid timestamp");
  const seen = new Set<string>();
  for (const item of input.evidence) {
    validateEvidence(item);
    if (seen.has(item.id)) throw new Error(`duplicate evidence id: ${item.id}`);
    seen.add(item.id);
  }
}
