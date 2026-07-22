# VERITAS V15 — Authoritative Persistence & Flatten Master Doc
Author: Codex (Turn 22). Source of truth for every optimal update across the full chat history.

This environment persists ONLY files under `src/`. `node_modules/unkbest/**`
and `vite.config.ts` reset every turn. Everything below is either (A) already
implemented persistently in `src/`, or (B) a non-persisting edit that must be
re-applied or flattened.

---

## PART 1 — CURRENT PERSISTENT `src/` ARCHITECTURE (verified in codebase)

Entry:
- `src/App.tsx` → mounts package `BaseApp` + workspace `V15Overlay`.
- `src/main.tsx` → unchanged React root.
- `src/index.css` → `@source "../node_modules/unkbest/src"` keeps Tailwind classes; light color-scheme; contrast fixes.

Overlay & UI (all persistent in `src/components/`):
- `V15Overlay.tsx` — floating pill: V15 toggle, 📊 Calibrate, 📖 Guide (→ persona modal), SearXNG url; injects `CalibDialogPersonaInjector` (🎭 Personas) into the calibration header; mounts `CalibrationDefaultsController`, `CitationStyleInjector`, `V15BatchAugment`, `PersonaGuideModal`. NO duplicate Personas in the pill.
- `V15CalibrationDialog.tsx` — THIN re-export of the package full dialog (Live/Batch/Guide, Draft Stats, CoVe, Adversarial, Citation Audit, Pipeline Diagram, Comparative Judge, Defense Pack, Cohesion, Gate Testbed). DO NOT re-fork into an abbreviated local copy (that caused the Turn-16 UI regression).
- `V15Toggle.tsx` — re-export of package toggle.
- `PersonaGuideModal.tsx` — full Williams guide clone: Oracle banner, 24-archetype menu (left), detail panel (right) with WHAT IT CHANGES / SUPPRESSES / SHARED IDEA / 50-100 WORD TRANSFORMATION / side-by-side comparison.
- `CalibrationPolicyInjector.tsx` —
  - `CalibrationDefaultsController`: label-anchored DOM setters (setNumberByLabel/setSelectByLabel/setChecked) that force: 4-Stage ON, N-Deep 3, Cluster 5, SLOOP 4, Template OMEGA-STRATEGY, Style --bain-pe, Williams "The Strategist", Adversarial ON, Web grounding ON, OG ON, PrismaFetch OFF, Jina OFF, SearXNG ON, Best-of-N models 1, Hypotheses 7, Pack ON, 246 pack ON, Gate Testbed ON, Single Judge ON.
  - `CitationStyleInjector`: `Cite [APA▼]` + `Native` self-test button placed before Advanced Config.
- `V15BatchAugment.tsx` —
  - `useV15Defaults()` writes the same defaults to localStorage (migration version key `veritas.v15.defaultsVersion` currently "20"; bump to force re-migration).
  - MutationObserver anchors into the batch RowDetailPane and portals 6 cards: DraftStatsCard, BestOfNCard, CoVeCard, AdversarialCard, CitationAuditCard, CalculationTraceCard (calc verified / no verify markers).

Library shims (persistent in `src/lib/`, each `export *` from package + local overrides that shadow via ESM named-export precedence):
- `v15-pipeline.ts` — WRAPS `runV15OnQuestion`:
  1. template-requirements policy injected into the question
  2. non-academic-priority pre-grounding (`groundQuestionPriority`)
  3. native scraper forced into webBackends
  4. deterministic calc-audit (`auditMath`) → forced correction re-pass when corrections or COVE mismatches exist
  5. untrusted/orphan citation sentence + fabricated author-year stripping
  6. deterministic calc corrections applied to text
  7. status-disclaimer enforcement + GAP-REPAIR pass (extractGapClauses/buildGapRepairPrompt) that replaces or drops [DATA GAP]/[ASSUMPTION]/[UNCERTAIN]
  8. deterministic citation render (inline + reference section via `formatCitations`)
  9. hard gate stripping unverified quantitative claims
  10. subscribable cache (`subscribeV15Cache`/`getV15Cached`) feeding the batch augment
  - ALSO overrides `runComparativeJudge` → `runComparativeJudgeRotated` and re-exports `groundQuestion` (priority grounder).
- `model-rotator.ts` — `runComparativeJudgeRotated`: walks the FULL active pool, least-loaded first, never thrashes one model; imports `tryAcquire` from `@/lib/v15-rate-limiter` (workspace override).
- `v15-rate-limiter.ts` — OVERRIDES package MODEL_LIMITS (package had rpm:1/rpd:1 for gemini-2.5-flash & gemma-4-31b-it, rpm:0 for gemma-4-26b-it → judge stalls). Workspace limits: 30 rpm / 500 rpd; `tryAcquire()` always returns true (server enforces real limits).
- `v15-grounding.ts` — `groundQuestion`: vertical-first (industry/news/forums via enhancedSearch) then package fleet then vertical fallback; reorders non-academic before academic.
- `scraper-enhanced.ts` — multi-engine + niche APIs: HN(Algolia), StackExchange(16 sites), Reddit, SemanticScholar, Crossref, OpenAlex, PubMed, GitHub, SEC EDGAR, PatentsView, Wayback; trust-domain scoring; deep extract (dates/numbers/entities/citations/emails/urls); 8-proxy fleet.
- `scraper-hardener.ts` — CORS proxy fleet (corsproxy.io, allorigins-raw, codetabs, cors.sh, yacdn, whateverorigin) + `robustFetch`.
- `v15-calc-audit.ts` — `auditMath` (block/inline LaTeX + prose arithmetic + one-variable linear solve), `Correction`/`InvariantFlag` types, `buildCalcAuditPrompt`.
- `citation-formatter.ts` — `formatCitations`: inline citation exactly after cited text + full reference/bibliography in APA/MLA/Chicago/IEEE/AMA; `orgLabel` prefers title, rejects bare TLD/DOI hosts (fixes "(Doi, 2026)"); `yearOf` only from title text, never invents from retrieval timestamp.
- `template-requirements.ts` — per-template quality floor (min equations w/ hand trace + valid answer + deterministic calc gate), CITATION_STYLES, status-language rules.
- `williams-persona-guide.ts` — 24 personas w/ tier, rarity, whatChanges, whatSuppresses, cadence, 50-100 word sample transformations; `comparePersonas`.
- Other shims: `williams-style`, `v15-state`, `v15-questions`, `v15-gate-testbed`, `pipeline`, `models`, `model-intelligence`, `memory-governor`, `flaws/*`, `flaw-registry`, `failure-modes`, `elo-registry`, `defense-registry`, `adversarial-engine`.

Default calibration (CONFIRMED): Williams **The Strategist**, 4-Stage ON, N-Deep **3**, Cluster **5**, SLOOP **4**, Template **OMEGA-STRATEGY**, Style **--bain-pe**, Best-of-N models **1**, Hypotheses **7**, Pack **ON**, 246 Defense **ON**, Gate Testbed **ON**, Single Judge **ON**.

---

## PART 2 — NON-PERSISTING EDITS THAT MUST BE RE-APPLIED EACH TURN (or flattened)

These were applied to `node_modules` or `vite.config.ts` in prior turns and RESET.
The `src/` shims above already replicate their intent, EXCEPT:

1. `vite.config.ts` native-scraper plugin wiring
   - Prior edit added `nativeScraperPlugin()` to `plugins[]` so `/api/native-search` and `/api/native-selftest` served in dev/preview.
   - RESET every turn. The `Native` self-test button and native scraper route depend on it. Must be re-added to `vite.config.ts` OR the native routes must be reimplemented client-side (not currently possible for SSRF-protected node plugin).
   - STATUS: non-persistent; re-apply if a task needs live native scraping.

2. Package `v15-pipeline.ts` rejected-pass telemetry (guard trajectory)
   - Prior edit pushed rejected lower-scoring N-Deep candidates into passHistory so guard could visibly move down.
   - RESET. The workspace shim cannot inject into the package's internal N-Deep loop. To persist, this must be handled by flattening (Part 3).

3. Package `v15-grounding.ts` vertical fallback
   - Prior edit added enhancedSearch fallback inside the package grounder.
   - RESET, but `src/lib/v15-grounding.ts` now supersedes it for workspace callers. Package-internal `groundQuestion` calls inside the package pipeline still use the package version.

4. Package `omega-templates.ts` SOP_THRESHOLD lines — RESET; superseded by `src/lib/template-requirements.ts` policy injection.

5. Package `v15-pipeline.ts` calc-audit import + return field (`calcAudit`) — RESET; superseded by workspace shim wrapping.

Everything else optimal from the chat history is captured in Part 1 and persists.

---

## PART 3 — ONE-SHOT FLATTEN PROMPT FOR A FRONTIER LLM

Paste the following prompt plus the full repo (all `src/` + `node_modules/unkbest/src/`) into a frontier model to produce a single flat, dependency-free operational app.

---BEGIN PROMPT---

You are a senior build engineer. You are given a React + Vite + Tailwind app that
is currently split across three layers:
  (a) a published npm package `unkbest` under `node_modules/unkbest/src/**`
      containing the real application (BaseApp, ChatApp, GBSDashboard, the full
      V15CalibrationDialog, all `lib/*` engines, workers, connectors),
  (b) workspace `src/**` shims that `export *` from the package and locally
      override selected symbols (v15-pipeline, model-rotator, v15-rate-limiter,
      v15-grounding, citation-formatter, template-requirements, scraper-enhanced,
      williams-persona-guide, V15Overlay, V15BatchAugment, PersonaGuideModal,
      CalibrationPolicyInjector, V15CalibrationDialog re-export),
  (c) `src/App.tsx` mounting package `BaseApp` + workspace `V15Overlay`.

GOAL: Produce ONE flattened, self-contained application under `src/` that has NO
imports from `node_modules/unkbest/**` and NO shim/sidecar/re-export
indirection, while preserving 100% of current UI/UX and behavior.

HARD REQUIREMENTS:
1. Merge every package module that the app actually imports into real `src/`
   files (copy source verbatim, then apply the workspace overrides IN PLACE so
   the local override becomes the single definition — delete the `export *`
   shim pattern entirely).
2. Resolve the ESM "local export shadows star re-export" pattern by physically
   replacing the package symbol with the workspace version. Specifically:
   - `runComparativeJudge` = the rotated multi-model version (walks full pool,
     never single-model RPM thrash).
   - `MODEL_LIMITS` = workspace generous limits (30 rpm / 500 rpd all models);
     `tryAcquire` always returns true.
   - `runV15OnQuestion` = the wrapped version with: template-requirements policy
     injection, non-academic-priority grounding, native+OG scraper, deterministic
     calc-audit + forced correction re-pass, COVE correction, untrusted/orphan
     citation stripping, fabricated author-year stripping, gap-repair pass
     (replace/drop [DATA GAP]/[ASSUMPTION]/[UNCERTAIN]), deterministic citation
     render (inline + reference section, APA/MLA/Chicago/IEEE/AMA), hard gate for
     unverified quantitative claims, subscribable result cache.
   - `groundQuestion` = vertical-first (industry/news/forums) then full fleet.
   - `orgLabel`/`yearOf` = title-first, never fabricate host/year (no "(Doi, 2026)").
3. Merge `BaseApp` + `App` + `V15Overlay` + `V15BatchAugment` +
   `V15CalibrationDialog` + `PersonaGuideModal` + `CalibrationPolicyInjector`
   into a coherent component tree. Keep the calibration dialog's FULL UI
   (Live/Batch/Guide tabs, Draft Stats, Best-of-N, CoVe, Adversarial Red-Team,
   Citation Trust Audit, Calculation Trace, Pipeline Diagram, Comparative Judge,
   Defense Pack, Cohesion, Gate Testbed, Divergence Log, Advanced Config).
   Keep the floating V15 pill (Toggle, Calibrate, Guide, SearXNG, Personas in
   the calibration header only — no duplicates).
4. Preserve default calibration: Williams The Strategist, 4-Stage ON, N-Deep 3,
   Cluster 5, SLOOP 4, OMEGA-STRATEGY, --bain-pe, Best-of-N models 1,
   Hypotheses 7, Pack ON, 246 Defense ON, Gate Testbed ON, Single Judge ON.
5. Keep web workers (`graph.worker.ts`, `compute.worker.ts`) as real files with
   `new Worker(new URL(...), import.meta.url)` so Vite bundles them.
6. Keep `vite.config.ts` with `@tailwindcss/vite`, `@vitejs/plugin-react`,
   `vite-plugin-singlefile`, `@` alias → `src`, and the native-scraper plugin.
7. Do NOT change any UI/UX from the user's perspective. Only the backend module
   graph is flattened. No behavior, panel, color, position, or default changes.
8. Zero TypeScript errors, zero unused-import errors, `npm run build` green.
9. Output the complete flattened file tree under `src/` with full file contents.

DELIVERABLE: the flattened `src/` tree, each file complete, no `node_modules`
imports of the package, no `export *` shims, build-verified.

---END PROMPT---

---

## PART 4 — LEDGER (unfinished, runtime-dependent)
- Live Gemini + native scraper browser smoke test — ~2500 tok / 1 turn.
- Vertical-API CORS/rate-limit verification — ~1800 tok / 1 turn.
- Full symbolic solver (calculus/matrix beyond arithmetic+linear) — ~5000 tok / 2 turns.
- Parsed author/year/DOI bibliographic metadata — ~2500 tok / 1 turn.
- Flatten execution (Part 3 prompt) — ~15000 tok / 3-4 turns if done in-repo.

Status: unfinished (5 items).
