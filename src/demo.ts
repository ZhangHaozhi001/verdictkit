// Demo: run both apps over the fixtures, write out/cards.json (verdicts)
// and out/verdict-cards.html (static page). Run: npm run demo
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate } from "./core/verdict.ts";
import { renderCardsHtml, toCard } from "./core/render.ts";
import type { ClaimPackage } from "./apps/claim-check.ts";
import { claimCheckPack, claimToInput } from "./apps/claim-check.ts";
import type { ReleaseManifest } from "./apps/ship-or-noship.ts";
import { manifestToInput, shipOrNoShipPack } from "./apps/ship-or-noship.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name: string) => JSON.parse(readFileSync(join(root, "fixtures", name), "utf8"));

const shipGo = evaluate(manifestToInput(readJson("ship-go.json") as ReleaseManifest), shipOrNoShipPack);
const shipNoGo = evaluate(manifestToInput(readJson("ship-nogo.json") as ReleaseManifest), shipOrNoShipPack);
const claimTrue = evaluate(claimToInput(readJson("claim-true.json") as ClaimPackage), claimCheckPack);
const claimFalse = evaluate(claimToInput(readJson("claim-false.json") as ClaimPackage), claimCheckPack);

const verdicts = [shipGo, shipNoGo, claimTrue, claimFalse];
mkdirSync(join(root, "out"), { recursive: true });
writeFileSync(join(root, "out", "cards.json"), JSON.stringify(verdicts, null, 2) + "\n");
writeFileSync(
  join(root, "out", "verdict-cards.html"),
  renderCardsHtml(verdicts.map(toCard), verdicts[0]?.evaluatedAt ?? ""),
);
for (const v of verdicts) console.log(`${v.app} :: ${v.subject} => ${v.label}${v.firm ? "" : " (downgraded)"}`);
console.log("Wrote out/cards.json and out/verdict-cards.html");
