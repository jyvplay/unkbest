/**
 * Flatten Verification Script
 * Run with: npx vite-node src/flatten-verify.ts
 * OR: npx tsx src/flatten-verify.ts
 *
 * Checks structural invariants AFTER the flatten is complete.
 * Does NOT need a browser, API key, or running server.
 * Exit 0 = all passed. Exit 1 = failures found.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(__dirname);
const ROOT = resolve(SRC, "..");
let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function fileExists(rel: string): boolean {
  return existsSync(join(SRC, rel));
}

function fileContent(rel: string): string {
  const p = join(SRC, rel);
  return existsSync(p) ? readFileSync(p, "utf-8") : "";
}

// Utility: check a file has no package imports (used in the walk below)
function _noPackageImport(content: string): boolean {
  return !content.includes("node_modules/unkbest");
}
void _noPackageImport;

function countFiles(dir: string): number {
  let count = 0;
  const full = join(SRC, dir);
  if (!existsSync(full)) return 0;
  for (const f of readdirSync(full, { recursive: true })) {
    const fp = join(full, String(f));
    if (statSync(fp).isFile()) count++;
  }
  return count;
}

console.log("\n🔍 FLATTEN VERIFICATION\n");

// ── F1: Build artifact exists ──
console.log("Build artifacts:");
check("dist/index.html exists", existsSync(join(ROOT, "dist", "index.html")));

// ── F2: No package imports in src ──
console.log("\nPackage import elimination:");
const srcFiles: string[] = [];
function walkSrc(dir: string) {
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    if (statSync(fp).isDirectory()) {
      if (f !== "node_modules" && f !== "dist") walkSrc(fp);
    } else if (/\.(ts|tsx)$/.test(f)) {
      srcFiles.push(fp);
    }
  }
}
walkSrc(SRC);
let pkgImportCount = 0;
for (const f of srcFiles) {
  const content = readFileSync(f, "utf-8");
  if (content.includes("node_modules/unkbest")) {
    pkgImportCount++;
    console.error(`    ⚠ Package import found in ${f.replace(SRC, "src")}`);
  }
}
check("Zero package imports in src/**", pkgImportCount === 0, `${pkgImportCount} file(s) still import from node_modules`);

// ── F3: Key files exist ──
console.log("\nKey files:");
const required = [
  "App.tsx", "main.tsx", "index.css",
  "BaseApp.tsx",
  "components/V15Overlay.tsx",
  "components/V15CalibrationDialog.tsx",
  "components/PersonaGuideModal.tsx",
  "components/V15BatchAugment.tsx",
  "components/ChatApp.tsx",
  "components/GBSDashboard.tsx",
  "lib/v15-pipeline.ts",
  "lib/v15-pipeline.base.ts",
  "lib/v15-rate-limiter.ts",
  "lib/model-rotator.ts",
  "lib/v15-grounding.ts",
  "lib/citation-formatter.ts",
  "lib/citation-ledger.ts",
  "lib/template-requirements.ts",
  "lib/v15-calc-audit.ts",
  "lib/scraper-enhanced.ts",
  "lib/williams-persona-guide.ts",
  "lib/omega-templates.ts",
  "lib/omega-templates.base.ts",
  "lib/v15-gemini.ts",
  "lib/v15-state.ts",
  "lib/elo-registry.ts",
  "lib/models.ts",
  "lib/app-state.tsx",
  "lib/gbse/graph.worker.ts",
  "lib/compute.worker.ts",
  "utils/cn.ts",
];
for (const f of required) {
  check(f, fileExists(f));
}

// ── F4: Symbol precedence ──
console.log("\nSymbol precedence:");
const pipeline = fileContent("lib/v15-pipeline.ts");
check("runV15OnQuestion contains calc-audit wrapping", pipeline.includes("auditMath") || pipeline.includes("calcAudit"));
check("runV15OnQuestion contains citation formatting", pipeline.includes("formatCitations") || pipeline.includes("citationAudit"));
check("runV15OnQuestion contains gap-repair", pipeline.includes("extractGapClauses") || pipeline.includes("GAP REPAIR") || pipeline.includes("gap-repair"));
check("runComparativeJudge walks full pool", pipeline.includes("runComparativeJudgeRotated") || fileContent("lib/model-rotator.ts").includes("runComparativeJudgeRotated"));

const rateLimiter = fileContent("lib/v15-rate-limiter.ts");
check("tryAcquire always returns true", rateLimiter.includes("return true") || rateLimiter.includes("always"));
check("MODEL_LIMITS has generous rpm", rateLimiter.includes("rpm: 30") || rateLimiter.includes("rpm:30"));

const grounding = fileContent("lib/v15-grounding.ts");
check("groundQuestion prefers non-academic", grounding.includes("non-academic") || grounding.includes("vertical-first") || grounding.includes("industry"));

const citFormatter = fileContent("lib/citation-formatter.ts");
check("orgLabel rejects DOI hosts", citFormatter.includes("doi") || citFormatter.includes("BAD_HOSTS"));
check("yearOf does not fabricate from timestamp", citFormatter.includes("n.d.") && !citFormatter.includes("new Date(ts).getFullYear()"));

// ── F5: Defaults in V15CalibrationDialog ──
console.log("\nCalibration defaults:");
const dialog = fileContent("components/V15CalibrationDialog.tsx");
check("Default persona = The Strategist", dialog.includes('"The Strategist"'));
check("Default nDeepPasses = 3", dialog.includes("useState(3)") || dialog.includes("nDeepPasses, 3"));
check("Default clusterSize = 5", dialog.includes("useState(5)") || dialog.includes("clusterSize, 5"));
check("Default sloopPages = 4", dialog.includes("useState(4)") || dialog.includes("sloopPages, 4"));
check("Default templateId = OMEGA-STRATEGY", dialog.includes('"OMEGA-STRATEGY"'));
check("Default styleOverride = --bain-pe", dialog.includes('"--bain-pe"'));
check("Default bestOfNHypotheses = 7", dialog.includes("useState(7)") || dialog.includes("Hypotheses, 7"));
check("Default singleJudge = true", dialog.includes("setSingleJudge] = useState(true)"));
check("Default useDefensePack = true", dialog.includes("setUseDefensePack] = useState(true)"));

// ── F6: No export-star shims remaining ──
console.log("\nShim elimination:");
let shimCount = 0;
for (const f of srcFiles) {
  const content = readFileSync(f, "utf-8");
  const lines = content.split("\n");
  if (lines.length <= 5 && content.includes('export *') && content.includes('node_modules')) {
    shimCount++;
    console.error(`    ⚠ Shim file detected: ${f.replace(SRC, "src")}`);
  }
}
check("No shim-only files (≤5 lines + export * from node_modules)", shimCount === 0, `${shimCount} shim(s) remain`);

// ── F7: Williams persona guide has 24+ archetypes ──
console.log("\nPersona guide:");
const personas = fileContent("lib/williams-persona-guide.ts");
const personaCount = (personas.match(/name:\s*"/g) || []).length;
check("≥24 persona entries", personaCount >= 24, `found ${personaCount}`);

// ── F8: Template requirements ──
console.log("\nTemplate requirements:");
const tmpl = fileContent("lib/template-requirements.ts");
check("CITATION_STYLES defined", tmpl.includes("CITATION_STYLES"));
check("DETERMINISTIC CALCULATION GATE in policy", tmpl.includes("DETERMINISTIC CALCULATION GATE") || tmpl.includes("deterministic calc"));
check("Status language rule present", tmpl.includes("DATA GAP") || tmpl.includes("ASSUMPTION"));

// ── F9: Tailwind CSS ──
console.log("\nTailwind:");
const css = fileContent("index.css");
check("@import tailwindcss present", css.includes('@import "tailwindcss"'));
const hasPackageSource = css.includes("node_modules/unkbest");
check("No package @source after flatten (or still using shim)", !hasPackageSource || fileExists("@/index.css"));

// ── F10: File count sanity ──
console.log("\nFile counts:");
const libCount = countFiles("lib");
const compCount = countFiles("components");
check("lib/ has ≥60 files", libCount >= 60, `found ${libCount}`);
check("components/ has ≥20 files", compCount >= 20, `found ${compCount}`);

// ── Summary ──
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(50)}\n`);

process.exit(fail > 0 ? 1 : 0);
