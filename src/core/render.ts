// verdict-core — verdict-card rendering.
// Turns Verdict objects into a card data structure and a single static
// HTML page (no build step, no dependencies) shared by both apps.

import type { Verdict } from "./verdict.ts";

export interface VerdictCard {
  app: string;
  subject: string;
  label: string;
  firm: boolean;
  supportScore: string;
  refuteScore: string;
  reasons: string[];
  gaps: string[];
  citations: {
    sourceLabel: string;
    excerpt: string;
    publishedAt: string;
    authority: number;
    stance: string;
    contribution: string;
  }[];
}

export function toCard(verdict: Verdict): VerdictCard {
  return {
    app: verdict.app,
    subject: verdict.subject,
    label: verdict.label,
    firm: verdict.firm,
    supportScore: verdict.supportScore.toFixed(2),
    refuteScore: verdict.refuteScore.toFixed(2),
    reasons: verdict.reasons,
    gaps: verdict.gaps,
    citations: verdict.citations.map((c) => ({
      sourceLabel: c.sourceLabel,
      excerpt: c.excerpt,
      publishedAt: c.publishedAt,
      authority: c.authority,
      stance: c.stance,
      contribution: c.contribution.toFixed(2),
    })),
  };
}

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const LABEL_COLORS: Record<string, string> = {
  GO: "#1a7f37",
  "NO-GO": "#b3261e",
  CAUTION: "#b26a00",
  TRUE: "#1a7f37",
  FALSE: "#b3261e",
  UNVERIFIED: "#b26a00",
};

export function renderCardsHtml(cards: VerdictCard[], generatedAt: string): string {
  const cardHtml = cards
    .map((card) => {
      const color = LABEL_COLORS[card.label] ?? "#444";
      const citations = card.citations
        .map(
          (c) =>
            `<li><strong>${esc(c.sourceLabel)}</strong> <em>(${esc(c.stance)}, authority ${c.authority}, +${esc(c.contribution)})</em><br>“${esc(c.excerpt)}”<br><small>${esc(c.publishedAt)}</small></li>`,
        )
        .join("\n");
      const reasons = card.reasons.map((r) => `<li>${esc(r)}</li>`).join("\n");
      const gaps = card.gaps.length
        ? `<h4>Missing evidence</h4><ul>${card.gaps.map((g) => `<li>${esc(g)}</li>`).join("\n")}</ul>`
        : "";
      return `<section class="card">
<h2>${esc(card.app)}</h2>
<p class="subject">${esc(card.subject)}</p>
<p class="label" style="color:${color}">${esc(card.label)}${card.firm ? "" : " (downgraded)"}</p>
<p>support ${esc(card.supportScore)} · refute ${esc(card.refuteScore)}</p>
<h4>Why</h4><ul>${reasons}</ul>
${gaps}
<h4>Citations</h4><ul>${citations}</ul>
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>VerdictKit — verdict cards</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;background:#0d1117;color:#e6edf3}
.wrap{display:flex;gap:1rem;flex-wrap:wrap}.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1rem 1.25rem;max-width:560px;flex:1 1 420px}
.label{font-size:1.6rem;font-weight:700}.subject{color:#9da7b1}small{color:#9da7b1}</style>
</head><body>
<h1>VerdictKit verdict cards</h1>
<p>Generated ${esc(generatedAt)} — no verdict without two independent sources, quoted verbatim.</p>
<div class="wrap">
${cardHtml}
</div>
</body></html>
`;
}
