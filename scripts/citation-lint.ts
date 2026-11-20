// citation-lint — spec R4 as a runnable gate (the citation-lint hook calls this).
// Usage: node scripts/citation-lint.ts <verdicts.json> [more.json ...]
// Fails (exit 1) if any verdict is missing a label or any citation field.
import { readFileSync } from "node:fs";
import type { Verdict } from "../src/core/verdict.ts";
import { assertCitationComplete } from "../src/core/verdict.ts";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: citation-lint <verdicts.json> [...]");
  process.exit(2);
}
let checked = 0;
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8")) as Verdict | Verdict[];
  const verdicts = Array.isArray(data) ? data : [data];
  for (const verdict of verdicts) {
    assertCitationComplete(verdict);
    checked += 1;
  }
}
console.log(`citation-lint: ${checked} verdict(s) OK — every citation is complete`);
