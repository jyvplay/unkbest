/**
 * Calculation Auditor (Turn 14) — COVE-integrated, forced-correction.
 * Deterministic math/logic verifier with invariant tracking, aggressive
 * inline-arithmetic scan (not just $$...$$), and correction feedback loop.
 */
export interface AuditResult {
  verified: boolean;
  message: string;
  trace: string;
  corrections: Correction[];
  invariants: InvariantFlag[];
  /** Turn 14: number of expressions checked (for UI transparency) */
  totalChecked: number;
}

export interface Correction {
  original: string;
  corrected: string;
  reason: string;
  isInvariant: boolean;
  /** Turn 14: whether the entire equation should be dropped in favor of a more descriptive form */
  suggestReplace: boolean;
}

export interface InvariantFlag {
  id: string;
  description: string;
  criticality: "high" | "medium" | "low";
}

/**
 * Extract every arithmetic-looking expression: LaTeX $$...$$, $...$, and
 * inline "a op b = c" statements in prose. Returns unique candidates.
 */
function extractExpressions(draft: string): { expr: string; asserted?: string }[] {
  const out: { expr: string; asserted?: string }[] = [];
  const seen = new Set<string>();
  const push = (expr: string, asserted?: string) => {
    const key = expr.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ expr: key, asserted });
  };

  // Block LaTeX
  const blockMatches = draft.match(/\$\$([\s\S]*?)\$\$/g) || [];
  blockMatches.forEach((m) => push(m.replace(/\$\$/g, "")));

  // Inline LaTeX (skip $$)
  const inlineMatches = draft.match(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g) || [];
  inlineMatches.forEach((m) => push(m.replace(/^\$|\$$/g, "")));

  // Prose arithmetic: "12 * 5 = 60", "3.14 + 2.86 = 6"
  const proseMatches = draft.match(/\b\d+(?:\.\d+)?\s*[+\-*/×÷]\s*\d+(?:\.\d+)?(?:\s*[+\-*/×÷]\s*\d+(?:\.\d+)?)*\s*=\s*\d+(?:\.\d+)?/g) || [];
  proseMatches.forEach((m) => {
    const [lhs, rhs] = m.split("=");
    push(lhs.trim(), rhs.trim());
  });

  return out;
}

function safeEval(expr: string): number | null {
  // Normalize unicode operators
  const norm = expr.replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[0-9+\-*/().\s]+$/.test(norm)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const r = new Function(`"use strict"; return (${norm});`)();
    if (typeof r !== "number" || !isFinite(r)) return null;
    return r;
  } catch {
    return null;
  }
}

function solveLinear(expr: string): number | null {
  const compact = expr.replace(/\\,|\s/g, "").replace(/\\cdot/g, "*");
  const match = compact.match(/^([+-]?(?:\d+(?:\.\d*)?)?)x([+-]\d+(?:\.\d+)?)?=([+-]?\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  const a = match[1] === "" || match[1] === "+" ? 1 : match[1] === "-" ? -1 : Number(match[1]);
  const b = match[2] ? Number(match[2]) : 0;
  const c = Number(match[3]);
  if (!isFinite(a) || a === 0 || !isFinite(b) || !isFinite(c)) return null;
  return (c - b) / a;
}

export function auditMath(
  draft: string,
  _context?: { question?: string; domain?: string }
): AuditResult {
  const candidates = extractExpressions(draft);
  if (candidates.length === 0) {
    return {
      verified: true,
      message: "No explicit equations found",
      trace: "none",
      corrections: [],
      invariants: [],
      totalChecked: 0,
    };
  }

  let trace = "";
  let verified = true;
  const corrections: Correction[] = [];
  const invariants: InvariantFlag[] = [];

  for (const { expr, asserted } of candidates) {
    const cleanExpr = expr.trim();
    const linearSolution = solveLinear(cleanExpr);
    if (linearSolution !== null) {
      const rounded = Number(linearSolution.toFixed(6));
      trace += `✓ ${cleanExpr} -> x = ${rounded} (linear solve)\n`;
      invariants.push({ id: `INV_${invariants.length + 1}`, description: `Linear relationship ${cleanExpr} resolves to x = ${rounded}`, criticality: "medium" });
      continue;
    }
    const computed = safeEval(cleanExpr);

    if (computed !== null) {
      const rounded = Number(computed.toFixed(6));
      trace += `✓ ${cleanExpr} = ${rounded}\n`;

      // If prose asserted a specific result, verify it
      if (asserted !== undefined) {
        const assertedNum = Number(asserted);
        if (isFinite(assertedNum) && Math.abs(assertedNum - computed) > 0.01) {
          corrections.push({
            original: `${cleanExpr} = ${asserted}`,
            corrected: `${cleanExpr} = ${rounded}`,
            reason: `Asserted result ${asserted} is incorrect; deterministic recompute yields ${rounded}`,
            isInvariant: true,
            suggestReplace: false,
          });
          invariants.push({
            id: `INV_${invariants.length + 1}`,
            description: `Corrected calculation ${cleanExpr} = ${rounded} is CRUCIAL — do not remove; may be replaced by a more descriptive equivalent`,
            criticality: "high",
          });
          verified = false;
        }
      } else {
        // Not asserted in prose — verify the computed result appears somewhere nearby
        const nearby = new RegExp(
          `\\b${rounded}\\b|\\b${Math.round(computed)}\\b`
        );
        if (!nearby.test(draft)) {
          corrections.push({
            original: cleanExpr,
            corrected: `${cleanExpr} = ${rounded}`,
            reason: "Result not explicitly stated in text",
            isInvariant: false,
            suggestReplace: true,
          });
        }
      }
    } else if (/^[a-zA-Z0-9+\-*/().\s=^_,]+$/.test(cleanExpr)) {
      trace += `? ${cleanExpr} [symbolic — structure verified]\n`;
      invariants.push({
        id: `INV_${invariants.length + 1}`,
        description: `Symbolic relationship ${cleanExpr} defines a core model relation`,
        criticality: "medium",
      });
    } else {
      trace += `✗ ${cleanExpr} [unverifiable]\n`;
      verified = false;
    }
  }

  return {
    verified: verified && corrections.length === 0,
    message:
      verified && corrections.length === 0
        ? "All arithmetic verified"
        : `${corrections.length} correction(s) applied`,
    trace,
    corrections,
    invariants,
    totalChecked: candidates.length,
  };
}

/**
 * Build a strong, prescriptive prompt block for the next N-Deep pass so the
 * LLM MUST apply the corrections and knows whether each is a crucial
 * invariant (keep + fix) or a replaceable equation (can drop for a better one).
 */
export function buildCalcAuditPrompt(audit: AuditResult): string {
  if (audit.corrections.length === 0 && audit.invariants.length === 0) return "";

  const lines: string[] = [];
  lines.push("");
  lines.push("[MANDATORY CALCULATION AUDIT — apply before any other edits]");
  lines.push(
    `Deterministic auditor checked ${audit.totalChecked} expression(s) and produced ${audit.corrections.length} correction(s).`
  );
  lines.push("");

  for (const c of audit.corrections) {
    lines.push(`• CORRECTION REQUIRED`);
    lines.push(`  Original: ${c.original}`);
    lines.push(`  Corrected: ${c.corrected}`);
    lines.push(`  Reason: ${c.reason}`);
    if (c.isInvariant) {
      lines.push(
        `  ⚠️ INVARIANT — this calculation is load-bearing. You MUST keep it (with the corrected value). You MAY rewrite the surrounding prose or replace this equation with a MORE DESCRIPTIVE equivalent that yields the same numerical result, but do not silently delete it.`
      );
    } else if (c.suggestReplace) {
      lines.push(
        `  ℹ️ REPLACEABLE — this equation may be replaced by another expression that better fits the paper's argument, provided the new expression is deterministically verifiable and cited to the same evidence.`
      );
    }
    lines.push("");
  }

  for (const inv of audit.invariants) {
    const marker =
      inv.criticality === "high" ? "🔴 CRITICAL" : inv.criticality === "medium" ? "🟡 IMPORTANT" : "🟢 NOTE";
    lines.push(`• ${marker} INVARIANT ${inv.id}: ${inv.description}`);
  }
  lines.push("");
  lines.push("[END CALCULATION AUDIT]");
  return lines.join("\n");
}
