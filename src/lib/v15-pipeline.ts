/**
 * Workspace shim — re-exports the package pipeline verbatim, wraps
 * `runV15OnQuestion` with (1) a subscribable cache, (2) deterministic
 * calc-audit, (3) COVE-integrated forced-correction re-pass that fixes
 * the flat-guard-score root cause when corrections exist.
 *
 * Local `export`s override the star re-export per ES module resolution
 * rules (local name wins over star).
 */
export * from "./v15-pipeline.base";

import { runV15OnQuestion as _origRunV15 } from "./v15-pipeline.base";
import { auditMath, buildCalcAuditPrompt, type AuditResult } from "@/lib/v15-calc-audit";
import { getTemplateRequirements, type CitationStyle } from "@/lib/template-requirements";
import { formatCitations } from "@/lib/citation-formatter";
import { runComparativeJudgeRotated } from "@/lib/model-rotator";
import { groundQuestion as groundQuestionPriority } from "@/lib/v15-grounding";

// Override package comparative judge with multi-model rotation that walks the
// full active pool instead of thrashing a single RPM-limited model.
export async function runComparativeJudge(opts: {
  apiKey: string;
  question: string;
  baselineAnswer: string;
  v15Answer: string;
  judgeModel?: string;
}) {
  return runComparativeJudgeRotated(opts);
}

// Re-export priority grounder for any workspace caller
export { groundQuestionPriority as groundQuestion };

type _RunOpts = Parameters<typeof _origRunV15>[0];
type _RunOutBase = Awaited<ReturnType<typeof _origRunV15>>;
type _RunOut = _RunOutBase & { calcAudit?: AuditResult };

const _cache = new Map<string, _RunOut>();
const _listeners = new Set<() => void>();
const _notify = () =>
  _listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });

export function subscribeV15Cache(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn) as unknown as void;
}

export function getV15Cached(question: string): _RunOut | undefined {
  if (!question) return undefined;
  return _cache.get(question.trim());
}

export function listV15Cached(): { question: string; result: _RunOut }[] {
  return Array.from(_cache.entries()).map(([question, result]) => ({ question, result }));
}

function removeUntrustedCitationSentences(text: string, audit: any): { text: string; removed: string[] } {
  const bad = (audit?.auditResults || []).filter((r: any) => !r.trusted).map((r: any) => String(r.tag));
  let next = text;
  const removed: string[] = [];

  // 1) Drop sentences containing untrusted [S#] tags
  if (bad.length) {
    const chunks = next.split(/(?<=[.!?])\s+|\n{2,}/);
    const drop = chunks.filter((chunk) => bad.some((tag: string) => chunk.includes(tag)));
    removed.push(...drop);
    next = chunks.filter((chunk) => !bad.some((tag: string) => chunk.includes(tag))).join(" ");
  }

  // 2) Strip fabricated author-year parentheticals that never map to the ledger
  //    e.g. "(ESHG, 2024)", "(Doi, 2026)", "(Smith 2020)" when not from formatCitations.
  //    Keep only forms that came from our trusted formatter (we re-apply that later).
  //    Heuristic: remove (Word, YYYY) / (Word YYYY) when Word is a single token and
  //    not already present as a trusted org label from the ledger.
  const trustedOrgs = new Set(
    (audit?.auditResults || [])
      .filter((r: any) => r.trusted && r.entry?.title)
      .map((r: any) => String(r.entry.title).split(/\s+/)[0]?.toLowerCase())
      .filter(Boolean)
  );
  next = next.replace(/\(\s*([A-Za-z][A-Za-z0-9&.-]{1,24})\s*,?\s*(19|20)\d{2}[a-z]?\s*\)/g, (full, name: string) => {
    const n = String(name).toLowerCase();
    // Preserve if it matches a trusted ledger title token
    if (trustedOrgs.has(n)) return full;
    // Always drop known garbage hosts / placeholders
    if (["doi", "http", "https", "www", "source", "untitled", "unknown", "eshg", "tbd", "n.d", "nd"].includes(n)) {
      removed.push(full);
      return "";
    }
    // Drop untrusted author-year that has no ledger backing
    if (!(audit?.auditResults || []).some((r: any) => r.trusted)) {
      removed.push(full);
      return "";
    }
    // If we have trusted entries but this name isn't among them, strip it
    removed.push(full);
    return "";
  });

  // 3) Strip bare [S#] that survived with no ledger entry
  next = next.replace(/\[S\d+\]/g, (tag) => {
    const ok = (audit?.auditResults || []).some((r: any) => r.trusted && String(r.tag) === tag);
    if (!ok) {
      removed.push(tag);
      return "";
    }
    return tag;
  });

  next = next.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  return { text: next, removed };
}

function auditOrphanCitationTags(text: string): any | undefined {
  const tags = [...new Set(text.match(/\[S\d+\]/g) || [])];
  if (!tags.length) return undefined;
  return {
    entries: [],
    auditResults: tags.map((tag) => ({ tag, id: Number(tag.slice(2, -1)), found: false, trusted: false, claimContext: text.slice(Math.max(0, text.indexOf(tag) - 100), text.indexOf(tag) + tag.length + 100), snippetOverlap: 0 })),
    totalCitations: tags.length,
    trustedCount: 0,
    untrustedCount: 0,
    missingCount: tags.length,
  };
}

function enforceStatusDisclaimers(text: string): string {
  const marker = /(<\s*(?:data\s+gap|assumption|uncertain)\s*>|\[(?:DATA\s+GAP|ASSUMPTION|UNCERTAIN)\])/gi;
  return text.replace(marker, (match) => `${match} [DISCLAIMER: this is not a load-bearing conclusion; verify the missing input before acting]`);
}

/**
 * Turn-17: Extract every [DATA GAP] / [ASSUMPTION] / [UNCERTAIN] clause together
 * with its full sentence context so a follow-up pass can rewrite each one with
 * verified evidence. Returns an array of {marker, sentence} pairs.
 */
function extractGapClauses(text: string): { marker: string; sentence: string }[] {
  const out: { marker: string; sentence: string }[] = [];
  const markerRe = /(<\s*(?:data\s+gap|assumption|uncertain)\s*>|\[(?:DATA\s+GAP|ASSUMPTION|UNCERTAIN)\])/gi;
  let m;
  while ((m = markerRe.exec(text)) !== null) {
    const start = Math.max(0, text.lastIndexOf(".", m.index) + 1);
    const endDot = text.indexOf(".", m.index + m[0].length);
    const end = endDot < 0 ? Math.min(text.length, m.index + m[0].length + 200) : endDot + 1;
    const sentence = text.slice(start, end).trim();
    if (sentence && !out.some(o => o.sentence === sentence)) {
      out.push({ marker: m[0], sentence });
    }
  }
  return out;
}

/**
 * Turn-17: Build a targeted repair prompt telling the LLM to REPLACE each
 * uncertainty marker with a verified, calculated, or explicitly-sourced
 * statement in the next pass. If evidence cannot be found, the whole sentence
 * must be dropped rather than shipped with the marker still present.
 */
function buildGapRepairPrompt(gaps: { marker: string; sentence: string }[]): string {
  if (!gaps.length) return "";
  const lines: string[] = [];
  lines.push("");
  lines.push("[MANDATORY GAP REPAIR — replace, do not preserve markers]");
  lines.push(
    `${gaps.length} uncertainty marker(s) were detected in the prior draft. Your next revision MUST replace each one with either (a) a verified, source-cited statement, (b) a deterministically checkable calculation, or (c) complete removal of the sentence. Do NOT ship the draft with these markers still present as load-bearing text.`
  );
  lines.push("");
  gaps.slice(0, 8).forEach((g, i) => {
    lines.push(`${i + 1}. Marker: ${g.marker}`);
    lines.push(`   Sentence: ${g.sentence.slice(0, 300)}${g.sentence.length > 300 ? "…" : ""}`);
    lines.push(`   Action: replace with verified evidence, or delete the sentence entirely if unverifiable.`);
    lines.push("");
  });
  lines.push("[END GAP REPAIR]");
  return lines.join("\n");
}

function applyDeterministicCalcCorrections(text: string, audit: AuditResult): { text: string; changed: number } {
  let next = text;
  let changed = 0;
  for (const correction of audit.corrections) {
    if (!correction.original || !correction.corrected || !next.includes(correction.original)) continue;
    next = next.split(correction.original).join(correction.corrected);
    changed += 1;
  }
  return { text: next, changed };
}

/**
 * Wraps the package pipeline:
 *   1. First pass: run original engine.
 *   2. Deterministic calc-audit.
 *   3. If corrections found AND user did not opt out: RE-RUN pipeline with
 *      calc-audit prompt injected into the question, so the LLM is forced
 *      to apply corrections. Guard score is the max of both passes.
 */
export async function runV15OnQuestion(opts: _RunOpts): Promise<_RunOut> {
  const requestedStyle = (localStorage.getItem("veritas.v15.citationStyle") as CitationStyle) || "APA";
  const profile = (opts.profile || {}) as any;
  const policy = getTemplateRequirements(profile.templateId, requestedStyle);
  const normalizedOpts = {
    ...opts,
    question: `${opts.question}\n\n${policy}`,
    profile: {
      ...profile,
      // Native scraper is the first real route when OG is enabled; keep all
      // existing fallbacks available instead of replacing them.
      webSearch: profile.webSearch ?? true,
      webBackends: {
        ...(profile.webBackends || {}),
        ogScraper: profile.webBackends?.ogScraper ?? true,
        nativeScraper: true,
      },
    },
  } as _RunOpts;
  // Prefer non-academic vertical grounding first; package run still does its own
  // grounding, but we also inject evidence when package results are empty/academic-heavy.
  try {
    if (normalizedOpts.profile?.webSearch) {
      const g = await groundQuestionPriority({
        question: opts.question,
        backends: (normalizedOpts.profile as any).webBackends,
        depth: 6,
      });
      if (g.ok && g.evidenceBlock) {
        (normalizedOpts as any).question =
          `${g.evidenceBlock}\n\n${(normalizedOpts as any).question}\n\nUse only the [S#] evidence above for factual claims. Do not invent author-year citations.`;
      }
    }
  } catch {
    /* optional pre-ground */
  }

  const first = (await _origRunV15(normalizedOpts)) as _RunOut;
  let finalRes: _RunOut = first;

  try {
    const audit = auditMath(first.fixed || first.draft || "", { question: opts.question });
    finalRes = { ...first, calcAudit: audit };

    // Force a corrective re-pass IF we found real corrections and the first
    // pass isn't already at a very high guard score.
    const coveMismatches = Number((first as any).coveReport?.inconsistencies || 0);
    const needsCorrection = (audit.corrections.length > 0 || coveMismatches > 0);
    if (needsCorrection) {
      const covePrompt = coveMismatches > 0
        ? `\n\n[MANDATORY COVE CORRECTION]\n${coveMismatches} verification mismatch(es) were detected. Reconcile each mismatch against the retrieved evidence, revise the affected claim, and rerun the verification logic. Do not preserve an unsupported load-bearing claim.\n`
        : "";
      const correctionPrompt = buildCalcAuditPrompt(audit) + covePrompt;
      const augmentedOpts = {
        ...normalizedOpts,
        question: `${normalizedOpts.question}${correctionPrompt}`,
      };
      try {
        const second = (await _origRunV15(augmentedOpts)) as _RunOut;
        const secondAudit = auditMath(second.fixed || second.draft || "", {
            question: opts.question,
        });
        const secondCove = Number((second as any).coveReport?.inconsistencies || 0);
        const auditImproved = secondAudit.corrections.length < audit.corrections.length || secondCove < coveMismatches;
        // Prefer quality score, but allow a lower guard when the second pass
        // demonstrably removes a verified calc/COVE defect. This makes the
        // displayed guard history honest rather than monotonically cosmetic.
        if ((second.guardScore ?? 0) >= (first.guardScore ?? 0) || auditImproved) {
          finalRes = { ...second, calcAudit: secondAudit };
        }
      } catch {
        /* second pass optional — fall back to first */
      }
    }

    const citationAudit = (finalRes as any).citationAudit || auditOrphanCitationTags(finalRes.fixed || "");
    if (citationAudit) {
      const sanitized = removeUntrustedCitationSentences(finalRes.fixed || "", citationAudit);
      if (sanitized.removed.length > 0) {
        finalRes = {
          ...finalRes,
          fixed: sanitized.text,
          autoFixesApplied: [...(finalRes.autoFixesApplied || []), `removed ${sanitized.removed.length} untrusted citation sentence(s)`],
          citationAudit: { ...citationAudit, removedUntrustedTags: citationAudit.auditResults.filter((r: any) => !r.trusted).map((r: any) => r.tag) },
        } as _RunOut;
      }
      if (!(finalRes as any).citationAudit) finalRes = { ...finalRes, citationAudit } as _RunOut;
    }
    const finalAudit = (finalRes as any).calcAudit || auditMath(finalRes.fixed || "", { question: opts.question });
    const deterministic = applyDeterministicCalcCorrections(finalRes.fixed || "", finalAudit);
    finalRes = {
      ...finalRes,
      fixed: enforceStatusDisclaimers(deterministic.text),
      calcAudit: deterministic.changed > 0 ? auditMath(deterministic.text, { question: opts.question }) : finalAudit,
      autoFixesApplied: deterministic.changed > 0
        ? [...(finalRes.autoFixesApplied || []), `deterministically corrected ${deterministic.changed} calculation(s)`]
        : finalRes.autoFixesApplied,
    };

    // ── Deterministic citation rendering (inline + reference section) ────────
    // Runs after sanitization so only trusted [S#] markers remain, then emits
    // the user-selected style inline AND a fully-formatted reference list.
    const renderAudit = (finalRes as any).citationAudit;
    if (renderAudit && Array.isArray(renderAudit.auditResults) && renderAudit.auditResults.length > 0) {
      try {
        const trustRows = renderAudit.auditResults.map((r: any) => ({ id: Number(r.id), trusted: !!r.trusted, tag: String(r.tag) }));
        const ledger = Array.isArray(renderAudit.entries) ? renderAudit.entries : [];
        const formatted = formatCitations(finalRes.fixed || "", requestedStyle, trustRows, ledger);
        finalRes = {
          ...finalRes,
          fixed: formatted.text,
          citationAudit: { ...renderAudit, style: formatted.style, referenceCount: formatted.referenceCount, headingUsed: formatted.headingUsed },
          autoFixesApplied: [...(finalRes.autoFixesApplied || []), `rendered ${formatted.referenceCount} ${formatted.style} citation(s) inline + ${formatted.headingUsed}`],
        } as _RunOut;
      } catch {
        /* formatting is best-effort; keep the sanitized text */
      }
    }

    // ── Hard gate: quantitative claims must pass deterministic calc-audit ────
    // If the final audit reports any unverified corrections and the text still
    // contains the original wrong expression, the claim is stripped.
    try {
      const finalCalc = (finalRes as any).calcAudit;
      if (finalCalc && Array.isArray(finalCalc.corrections) && finalCalc.corrections.length) {
        let cleaned = finalRes.fixed || "";
        let removed = 0;
        for (const c of finalCalc.corrections) {
          if (c.isInvariant && cleaned.includes(c.original)) {
            // Remove the whole sentence containing the unverified claim.
            const re = new RegExp(`[^.!?]*${c.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^.!?]*[.!?]`, "i");
            if (re.test(cleaned)) {
              cleaned = cleaned.replace(re, "").replace(/\s{2,}/g, " ").trim();
              removed++;
            }
          }
        }
        if (removed > 0) {
          finalRes = {
            ...finalRes,
            fixed: cleaned,
            autoFixesApplied: [...(finalRes.autoFixesApplied || []), `removed ${removed} unverified quantitative claim(s)`],
          } as _RunOut;
        }
      }
    } catch { /* gate is best-effort */ }

    // ── Turn-17: Gap-repair pass ─────────────────────────────────────────────
    // If any [DATA GAP] / [ASSUMPTION] / [UNCERTAIN] markers remain, run one
    // more revision pass that explicitly instructs the LLM to REPLACE each
    // marker with verified evidence or drop the sentence. This closes the
    // loop between "disclaim" (prior behavior) and "actually fix" (required).
    try {
      const gaps = extractGapClauses(finalRes.fixed || "");
      if (gaps.length > 0 && (finalRes.guardScore ?? 0) < 9.5) {
        const repairPrompt = buildGapRepairPrompt(gaps);
        const repairOpts = {
          ...normalizedOpts,
          question: `${normalizedOpts.question}${repairPrompt}`,
        };
        try {
          const repaired = (await _origRunV15(repairOpts)) as _RunOut;
          const repairedGaps = extractGapClauses(repaired.fixed || "");
          // Accept the repair only if it demonstrably reduced the gap count and
          // did not tank the guard score by more than 0.5. This keeps the guard
          // trajectory honest while ensuring gaps get resolved.
          if (repairedGaps.length < gaps.length && (repaired.guardScore ?? 0) >= (finalRes.guardScore ?? 0) - 0.5) {
            finalRes = {
              ...repaired,
              calcAudit: auditMath(repaired.fixed || "", { question: opts.question }),
              autoFixesApplied: [
                ...(repaired.autoFixesApplied || []),
                `gap-repair pass: reduced uncertainty markers ${gaps.length} → ${repairedGaps.length}`,
              ],
            } as _RunOut;
          }
        } catch { /* repair pass is optional */ }
      }

      // Final hard gate: strip any sentence still carrying an uncertainty
      // marker so unverified claims never reach the published draft.
      const stillGapped = extractGapClauses(finalRes.fixed || "");
      if (stillGapped.length > 0) {
        let cleaned = finalRes.fixed || "";
        let dropped = 0;
        for (const g of stillGapped) {
          if (cleaned.includes(g.sentence)) {
            cleaned = cleaned.replace(g.sentence, "").replace(/\s{2,}/g, " ").trim();
            dropped++;
          }
        }
        if (dropped > 0) {
          finalRes = {
            ...finalRes,
            fixed: cleaned,
            autoFixesApplied: [
              ...(finalRes.autoFixesApplied || []),
              `stripped ${dropped} sentence(s) with unresolved uncertainty markers`,
            ],
          } as _RunOut;
        }
      }
    } catch { /* gap-repair is best-effort */ }

    if (opts.question) {
      _cache.set(String(opts.question).trim(), finalRes);
      _notify();
    }
  } catch {
    /* audit is best-effort; do not break the pipeline */
  }
  return finalRes;
}

export function detectTruncation(text: string, opts?: any): any { return { truncated: false, reason: "" }; }

export interface V15RunOutcome { question: string; draft: string; fixed: string; issues: any[]; autoFixesApplied: string[]; guardScore: number; judgeScore: number | null; judgeNote: string; modelUsed: string; passes: number; stable: boolean; totalLatencyMs: number; error?: string; judgeRoster?: any[]; eloConsensus?: any; testbedGatesProposed?: any[]; groundingProvider?: string; groundingCount?: number; runSettings?: any; }

export interface V15Profile { fourStage?: boolean; nDeep?: boolean; nDeepPasses?: number; cluster?: boolean; clusterSize?: number; sloop?: boolean; sloopPages?: number; templateId?: string; styleOverride?: string; williamsPersona?: string; adversarial?: boolean; webSearch?: boolean; webBackends?: any; useOriginalDefensePack?: boolean; }

export interface DivergenceEntry { timestamp: number; question: string; guardScore: number; judgeScore: number; delta: number; suggestion: any; authorityModel: string; judgePanel?: any[]; decision?: string; }

export function getDivergenceLog() { try { return JSON.parse(localStorage.getItem("veritas.v15.divergenceLog") || "[]"); } catch { return []; } }

export function saveDivergenceEntry(entry) { try { const log = getDivergenceLog(); log.push(entry); localStorage.setItem("veritas.v15.divergenceLog", JSON.stringify(log)); } catch {} }

export function clearDivergenceLog() { try { localStorage.removeItem("veritas.v15.divergenceLog"); } catch {} }

export async function analyzeDivergence(opts) { return null; }

export async function runCohesionPass(opts) { return null; }

export interface CohesionPassResult { sectionsRewritten: number; cohesionIssues: string[]; improved: string; }

export interface ComparativeJudgeResult { baselineScore: number; v15Score: number; gap: number; winner: string; rationale: string; }
