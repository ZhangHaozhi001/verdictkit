// verdict-core — scoring (spec R3).
// contribution = authority x freshness decay x corroboration increment.
// freshness: half-life decay, 2^(-ageHours / halfLifeHours), half-life default 72h.
// corroboration: within one stance, the k-th *independent* source (k starting at 0)
// multiplies its items by (1 + increment * k). Deterministic: items are ordered by
// base score desc, then id asc, before increments are assigned.

import type { EvidenceItem } from "./evidence.ts";

export interface ScoreConfig {
  halfLifeHours: number;
  corroborationIncrement: number;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  halfLifeHours: 72,
  corroborationIncrement: 0.25,
};

export interface ScoredEvidence extends EvidenceItem {
  ageHours: number;
  freshness: number;
  contribution: number;
}

export function freshnessAt(publishedAt: string, now: string, halfLifeHours: number): number {
  const ageMs = Date.parse(now) - Date.parse(publishedAt);
  const ageHours = Math.max(0, ageMs / 3_600_000);
  return Math.pow(2, -ageHours / halfLifeHours);
}

export function scoreEvidence(
  evidence: EvidenceItem[],
  now: string,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): ScoredEvidence[] {
  const withBase = evidence.map((item) => {
    const ageHours = Math.max(0, (Date.parse(now) - Date.parse(item.publishedAt)) / 3_600_000);
    const freshness = freshnessAt(item.publishedAt, now, config.halfLifeHours);
    return { item, ageHours, freshness, base: item.authority * freshness };
  });

  // Assign corroboration increments per stance, strongest base first.
  const byStance = new Map<string, typeof withBase>();
  for (const row of withBase) {
    const list = byStance.get(row.item.stance) ?? [];
    list.push(row);
    byStance.set(row.item.stance, list);
  }
  const contribution = new Map<string, number>();
  for (const rows of byStance.values()) {
    const ordered = [...rows].sort((a, b) => b.base - a.base || a.item.id.localeCompare(b.item.id));
    // Each independent source gets an index in first-appearance order; every
    // item from that source earns that source's increment (repeats of the
    // same source do not earn a new increment).
    const sourceIndex = new Map<string, number>();
    for (const row of ordered) {
      if (!sourceIndex.has(row.item.sourceId)) sourceIndex.set(row.item.sourceId, sourceIndex.size);
      const k = sourceIndex.get(row.item.sourceId) ?? 0;
      contribution.set(row.item.id, row.base * (1 + config.corroborationIncrement * k));
    }
  }

  return withBase
    .map(({ item, ageHours, freshness }) => ({
      ...item,
      ageHours,
      freshness,
      contribution: contribution.get(item.id) ?? 0,
    }))
    .sort((a, b) => b.contribution - a.contribution || a.id.localeCompare(b.id));
}

export function distinctSources(items: ScoredEvidence[], stance: string): number {
  return new Set(items.filter((i) => i.stance === stance).map((i) => i.sourceId)).size;
}

export function stanceScore(items: ScoredEvidence[], stance: string): number {
  return items.filter((i) => i.stance === stance).reduce((sum, i) => sum + i.contribution, 0);
}
