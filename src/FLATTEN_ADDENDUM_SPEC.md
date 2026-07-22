# VERITAS V15 — Flatten Addendum Spec (Gap-Closure for MASTER doc)
Author: Codex (Turn 23). Companion to `src/FLATTEN_AND_PERSISTENCE_MASTER.md`.
Purpose: closes every missing/vague/ambiguous point in the MASTER Part-3 flatten
prompt so a frontier LLM can execute the flatten in ONE shot with zero guessing.
Same format and directive style as MASTER. Read MASTER first, then this file.

---

## GAP AUDIT — what MASTER Part 3 left underspecified

G1. No module inventory (which package files to copy, which to skip).
G2. No symbol-precedence table (exact winner per duplicated export).
G3. No localStorage key registry (defaults, keys, presets, gates).
G4. No rule for converting DOM-injection hacks into native React after flatten.
G5. No npm dependency list.
G6. No acceptance-test checklist (how to verify nothing regressed).
G7. Circular-import trap (citation-ledger ↔ model-rotator dynamic import).
G8. Cache-key subtlety (cache keyed on ORIGINAL question, not policy-augmented).
G9. Node-only overrides must not leak into the client bundle.
G10. Base-file split pattern (x.ts re-exporting x.base.ts) not addressed.
G11. Tailwind at-source directive must be removed after flatten.
G12. No file-count/size budget, so the LLM may summarize instead of copying.
G13. Defaults precedence after flatten (dialog state vs localStorage vs DOM controller) undefined.
G14. Package-internal callers of tryAcquire/groundQuestion still hit package versions — flatten must repoint them; MASTER only implies it.
G15. Worker filename hashes in dist are fine but MASTER never says workers must stay OUTSIDE the singlefile inline.
G16. PERSIST_CANARY.txt and ledger docs handling unstated.
G17. No rollback rule if the flatten build fails.
G18. Package package.json "build" runs a script.js that does not exist in workspace — flatten must NOT copy package scripts.

---

## A. MODULE INVENTORY (G1, G10, G12) — copy list is EXHAUSTIVE, copy VERBATIM then patch

COPY from node_modules/unkbest/src into workspace src (target path = same
relative path unless noted). "MERGE" = workspace file already exists and WINS;
fold any package-only exports the app uses into it, delete the export-star line.

Components (to src/components/):
- BaseApp.tsx (target src/BaseApp.tsx), ChatApp.tsx, GBSDashboard.tsx,
  ResourceEstimatorPage.tsx, ControlPlanePage.tsx, AdaptersPage.tsx,
  TemplatesPage.tsx, ModulesPage.tsx, MemoryInspector.tsx, AdversarialPanel.tsx,
  LiveResourceHUD.tsx, HUD.tsx, PreFlightHUD.tsx, MemoryMonitor.tsx,
  MemoryStressPanel.tsx, StylePersonaPanel.tsx, StatFinancePanel.tsx,
  SharedChatInput.tsx, RichText.tsx, MarkdownLite.tsx, ReportOSPanel.tsx,
  PrismaFetchTracePanel.tsx, LongWriterPanel.tsx, HypothesisPanel.tsx,
  GraphView.tsx, FailureModesPanel.tsx, EntitySheetPanel.tsx,
  DeepReasoningTrace.tsx, DebugTracePanel.tsx, ConfigPanel.tsx,
  ComputeSandboxPanel.tsx, ArtifactPanel.tsx, AnswerPanel.tsx,
  AnchorBaselinePanel.tsx, TestPanel.tsx, TraceLog.tsx,
  V15CalibrationDialog.tsx (FULL 1872-line package version replaces the thin
  re-export — then apply Section D patches), V15Toggle.tsx, V15Overlay.tsx is
  MERGE (workspace wins).

Chat (to src/chat/): VeritasChat.tsx, tier.ts, synthesis.ts.

Lib (to src/lib/): every file under package lib EXCEPT the overrides folder,
including the base-split pairs. Base-split rule (G10): for each pair x.ts +
x.base.ts, copy BOTH verbatim, keep the internal relative import; the pairs are
williams-style, v15-state, v15-pipeline(+.base), v15-gemini(+.base),
elo-registry(+.base), omega-templates(+.base), n-deep(+.base), jina(+.base),
sloop-runner(+.base), adversarial-engine(+.base), academic-sources(+.base),
scraper-hardener(+.base), browser-search-scraper(+.base),
continuation-detector(+.base), prismafetch(+.base under connectors),
williams-style(+.base), memory-stress-tests, and the plain singles: app-state.tsx,
constraints, defenses, defense-registry, failure-modes, flaw-registry, flaws/*
(all nine + sample-declarative-pack.json), models, model-intelligence,
model-rotator (MERGE — workspace wins), memory-governor, longwriter,
live-telemetry, gbse/* (all seven incl. graph.worker.ts), compute.worker.ts,
compute-sandbox, citation-ledger, calc-interceptor, browser-queue, browser-mtls,
atlas-dr, artifacts, artifact-registry, advanced-math, cors-proxy, coverage,
entity-resolver, feature-registry, nih-simulator, nih-vulnerability-fixes,
omega-templates, oracle-adapters, oracle-registry, orchestrator, output-boundary,
philosophy-toolkit, pipeline, precache, py-sandbox, quality-score, quant-engine,
quant-lib, reportos, research-os, resource-estimator, rpm-governor,
runtime-estimator, search-cache, sloop, small-model-adapters, sscp, uni-node,
universal-rigor-guard, v15-gate-testbed, v15-grounding (MERGE — workspace wins),
v15-questions, v15-rate-limiter (MERGE — workspace wins), visual-table-generator,
wasm-runtime, worker-pool, writing-tiers, connectors/* (all seven).

Utils: utils/cn.ts already exists in workspace — keep workspace copy.

SKIP entirely (G9 — Node-only, dev-server side): lib/overrides/* EXCEPT copy
vite-native-scraper.ts and its sibling vite-native-* files to a NEW top-level
folder server-plugins/ (NOT under src/ — they import node:fs, node:http etc. and
must never be reachable from client imports). vite.config.ts then imports the
plugin from the server-plugins folder. CAVEAT: outside-src files do not persist
in this turn-based env, so the plugin re-copy is a per-turn task until deployed.
Also SKIP: package vite.config.ts, tsconfig.json, package.json, unify script,
markdown docs, dist folder, PERSIST_CANARY (workspace already has its own).
G18: never copy the package build script — it references a script that does not
exist in the workspace; keep the workspace build command as plain vite build.

---

## B. SYMBOL-PRECEDENCE TABLE (G2, G14) — WORKSPACE version is canonical

| Symbol | Canonical definition | Repoint these internal callers |
|---|---|---|
| runV15OnQuestion | workspace wrapped version | V15CalibrationDialog runBatch + runLiveOnce |
| runComparativeJudge | runComparativeJudgeRotated (full-pool walk) | dialog batch + live |
| tryAcquire | workspace always-true version | model-rotator, judgeOneEnhanced, comparative judge — ALL internal callers (G14) |
| MODEL_LIMITS | workspace 30rpm/500rpd map | snapshotUsage, pickLeastLoaded |
| groundQuestion | workspace vertical-first version | pipeline template-grounding, HDIG, re-ground, CoVe (G14) |
| orgLabel / yearOf | workspace title-first anti-fabrication versions | formatCitations only |
| Guide button | opens PersonaGuideModal, NEVER the calibration dialog | V15Overlay |

Cache-key rule (G8): the result cache MUST stay keyed on the ORIGINAL trimmed
user question, never the policy-augmented prompt, or the batch augment lookup
breaks. In the flattened runV15OnQuestion, capture originalQuestion FIRST.

Circular-import rule (G7): citation-ledger dynamically imports model-rotator
inside verifyEntailment. Keep that dynamic import EXACTLY as-is after flatten;
converting it to a static import creates a cycle with v15-pipeline.

---

## C. LOCALSTORAGE REGISTRY (G3) — single source of truth after flatten

veritas.v15.enabled, veritas.v15.defaultsVersion (bump to force re-migration),
veritas.v15.williamsPersona="The Strategist", fourStage, nDeep, nDeepPasses=3,
cluster, clusterSize=5, sloop, sloopPages=4, templateId=OMEGA-STRATEGY,
styleOverride=--bain-pe, bestOfNModels=1, bestOfNHypotheses=7,
bestOfNPackHypotheses, useDefensePack, advancedGates, webSearch, webOg,
webPrisma=false, webJina=false, webSearxng, nativeScraper, citationStyle=APA.
Plus package-owned keys (read-only, do not rename): veritas.keys.v3 (gemini key),
veritas.v15.rotationKeys, veritas.v15.allowedModels, veritas.v15.savedPresets,
searxng url/apiKey/categories/language/safe keys, advancedGates keys, and the
divergence-log key used by getDivergenceLog.

Defaults precedence AFTER flatten (G13): dialog useState initializers read
localStorage with the constants above as fallback — the DOM-based
CalibrationDefaultsController and CitationStyleInjector are then DELETED and
replaced by native JSX inside the flattened dialog header (see Section D).

---

## D. DOM-INJECTION TO NATIVE REACT (G4) — patches applied INSIDE the copied dialog

D1 Citation selector + Native button: render directly in the dialog sub-tab row
   before the Advanced Config button. Order: Live Compare, Batch Bank, Web
   Grounding Guide, Cite dropdown (APA/MLA/Chicago/IEEE/AMA, persists to
   citationStyle key), Native self-test button (fetch /api/native-selftest,
   states idle/checking/ok/down), Personas button (violet, opens
   PersonaGuideModal via a callback prop onOpenPersonas passed from V15Overlay),
   Advanced Config, Divergence Log. Delete CalibrationPolicyInjector.tsx after.

D2 Batch augment cards: move DraftStatsCard/BestOfNCard/CoVeCard/AdversarialCard/
   CitationAuditCard/CalculationTraceCard INSIDE the flattened RowDetailPane
   component (render after the existing grid-cols-2 baseline/V15 panel). Delete
   V15BatchAugment.tsx MutationObserver/portal machinery entirely.

D3 useV15Defaults: merge into V15CalibrationDialog as a useEffect that runs
   once on mount, writing localStorage defaults + bumping version key.

---

## E. NPM DEPENDENCIES (G5) — keep in workspace package.json

react, react-dom, clsx, tailwind-merge, axios, comlink, @google/generative-ai.
Dev: @tailwindcss/vite, tailwindcss, @types/node, @types/react, @types/react-dom,
@vitejs/plugin-react, typescript, vite, vite-plugin-singlefile.
REMOVE unkbest from dependencies after flatten.

---

## F. ACCEPTANCE TESTS (G6) — checklist after flatten build

F1 npm run build succeeds with zero TS errors (lint warnings in copied code OK).
F2 dist/index.html exists and is a valid single-file HTML.
F3 Open in browser: BaseApp shell loads (9-tab nav, header, shared input).
F4 V15 floating pill visible left-center: V15 toggle, Calibrate, Guide, SearXNG.
F5 Click Calibrate: dialog opens with correct defaults (verify all 14 defaults).
F6 Sub-tab row shows: Live Compare, Batch Bank, Web Grounding Guide, Cite APA,
   Native, Personas, Advanced Config, Divergence Log.
F7 Click Batch Bank: profile bar shows 4-Stage/N-Deep 3/Cluster 5/SLOOP 4/
   OMEGA-STRATEGY/--bain-pe/The Strategist/Adversarial/Web grounding.
F8 Run a batch with API key: baseline runs, V15 runs, comparative judge runs
   without rate-limit error (tryAcquire always true).
F9 Select a batch row: right panel shows prompt, run settings, baseline/V15
   side-by-side, comparative judge panel, AND the 6 augment cards (Draft Stats,
   Best-of-N, CoVe, Adversarial Red-Team, Citation Trust Audit, Calc Trace).
F10 Click Guide: PersonaGuideModal opens (not calibration dialog).
F11 Persona modal: Oracle banner, 24-archetype menu, detail panel with WHAT IT
    CHANGES/SUPPRESSES/SHARED IDEA/50-100 WORD TRANSFORMATION/comparison.
F12 Citations in V15 output: inline (Author, Year) or [n] per style, plus a
    References section at the end. No (Doi, 2026). Untrusted tags stripped.
F13 No [DATA GAP]/[ASSUMPTION]/[UNCERTAIN] in final output without disclaimer.
F14 Calculation Trace card shows calc verified or no verify.
F15 No duplicate Personas buttons anywhere.
F16 Web grounding returns non-academic sources (HN, Reddit, SE, GitHub, etc.)
    before academic-only results.

---

## G. WORKERS AND TAILWIND (G11, G15, G16)

G11: After flatten, change src/index.css @source to just "." (scan src itself).
G15: graph.worker.ts and compute.worker.ts must stay as separate files (not
     inlined by singlefile plugin). Vite handles this automatically if the
     Worker constructor uses `new URL("...", import.meta.url)`.
G16: Keep src/PERSIST_CANARY.txt. Delete src/FLATTEN_AND_PERSISTENCE_MASTER.md,
     src/FLATTEN_ADDENDUM_SPEC.md, and src/UNFINISHED_TASKS.md after flatten
     succeeds (they are build artifacts, not application code).

---

## H. ROLLBACK (G17)

If the flatten build fails, do NOT delete the shim architecture. Instead,
restore the thin V15CalibrationDialog re-export and keep the sidecar pattern
functional while debugging. The shim architecture is a working fallback.

---

## I. FLATTEN SCRIPT (src/flatten-verify.ts) — smoke test runner

After flatten, run this script (ts-node or vite-node) to verify key invariants
programmatically. It does NOT need a browser or API key.

