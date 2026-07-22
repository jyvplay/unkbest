/**
 * Persistent model-rotator shim.
 * Re-exports package rotator and adds multi-model comparative-judge helper
 * that honestly walks the full active pool instead of retrying one RPM-limited model.
 */
export * from "./model-rotator.base";
export {
  generateWithRotation,
  getActiveRotationPool,
  parallelJudgeRotation,
  ROTATION_POOL,
} from "./model-rotator.base";

import {
  generateWithRotation,
  getActiveRotationPool,
} from "./model-rotator.base";
import { pickLeastLoaded, tryAcquire, recordResult } from "@/lib/v15-rate-limiter";
import { geminiGenerate } from "@/lib/v15-gemini";

export interface ComparativeJudgeResultV2 {
  baselineScore: number;
  v15Score: number;
  gap: number;
  winner: "baseline" | "v15" | "tie";
  baselineImprovements: string[];
  v15Improvements: string[];
  rationale: string;
  judgeModel: string;
  ok: boolean;
  error?: string;
  rotationAttempts?: number;
}

/**
 * Independent comparative judge that tries EVERY model in the active pool
 * (least-loaded first), never reusing a rate-limited model in the same run.
 */
export async function runComparativeJudgeRotated(opts: {
  apiKey: string;
  question: string;
  baselineAnswer: string;
  v15Answer: string;
  judgeModel?: string;
}): Promise<ComparativeJudgeResultV2> {
  const pool = getActiveRotationPool();
  // Order: preferred → least loaded unused → rest shuffled
  const preferred = opts.judgeModel && pool.includes(opts.judgeModel) ? opts.judgeModel : null;
  const least = pickLeastLoaded(pool.filter((m) => m !== preferred));
  const rest = pool.filter((m) => m !== preferred && m !== least);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const order = [preferred, least, ...rest].filter((m): m is string => !!m);

  let lastErr = "";
  let attempts = 0;
  const tried = new Set<string>();

  for (const model of order) {
    if (tried.has(model)) continue;
    tried.add(model);
    attempts++;
    const acquired = await tryAcquire(model, true);
    if (!acquired) {
      lastErr = `${model}: rate-limited`;
      continue;
    }
    const prompt =
      `You are an INDEPENDENT comparative judge. Score A (baseline) and B (V15) 0-10.\n\n` +
      `MANDATORY CAPS (apply the LOWEST that fits per answer):\n` +
      `- Truncated/fragment → cap 1\n- Formula-only/partial calc → cap 3\n` +
      `- Restates question / requires reader to already know → cap 5\n` +
      `- Missing required units/jurisdiction/scope → cap 6\n\n` +
      `Anchors: reserve 9+ ONLY for expert-sign-off answers.\n\n` +
      `Return STRICT JSON only: {"baselineScore": <0-10>, "v15Score": <0-10>, "winner": "baseline"|"v15"|"tie", ` +
      `"rationale": "one paragraph explaining WHY the winner won", "baselineImprovements": ["..."], "v15Improvements": ["..."]}\n\n` +
      `QUESTION:\n${opts.question}\n\nA (baseline):\n${opts.baselineAnswer.slice(0, 7000)}\n\nB (V15):\n${opts.v15Answer.slice(0, 7000)}`;

    // Prefer generateWithRotation with the full remaining pool as fallback so a
    // single RPM hit does not abort the independent judge.
    const remaining = order.filter((m) => !tried.has(m) || m === model);
    const res = await generateWithRotation({
      apiKey: opts.apiKey,
      prompt,
      preferredModel: model,
      pool: remaining.length ? remaining : pool,
      maxOutputTokens: 1600,
    });
    recordResult(res.modelUsed || model, res.ok);
    if (!res.ok) {
      lastErr = `${model}: ${res.error ?? "generation failed"}`;
      // Mark failed attempt models so we don't thrash the same one
      for (const a of res.attempts || []) {
        if (!a.ok) tried.add(a.model);
      }
      continue;
    }
    try {
      const m = res.text.replace(/```json\s*/gi, "").replace(/```/g, "").match(/\{[\s\S]*\}/);
      const j = JSON.parse(m ? m[0] : res.text);
      const b = Math.max(0, Math.min(10, Number(j.baselineScore) || 0));
      const v = Math.max(0, Math.min(10, Number(j.v15Score) || 0));
      return {
        baselineScore: b,
        v15Score: v,
        gap: Math.round((v - b) * 100) / 100,
        winner:
          j.winner === "baseline" || j.winner === "v15" || j.winner === "tie"
            ? j.winner
            : v > b
              ? "v15"
              : v < b
                ? "baseline"
                : "tie",
        baselineImprovements: Array.isArray(j.baselineImprovements)
          ? j.baselineImprovements.map(String).slice(0, 6)
          : [],
        v15Improvements: Array.isArray(j.v15Improvements)
          ? j.v15Improvements.map(String).slice(0, 6)
          : [],
        rationale: String(j.rationale ?? "").slice(0, 700),
        judgeModel: res.modelUsed || model,
        ok: true,
        rotationAttempts: attempts,
      };
    } catch {
      lastErr = `${res.modelUsed || model}: JSON parse failed`;
      // fall through to next model
    }
  }

  // Absolute last attempt: single generateWithRotation across whole pool
  try {
    const res = await generateWithRotation({
      apiKey: opts.apiKey,
      prompt: `Score baseline A and V15 B 0-10 as independent judge. JSON only: {"baselineScore":n,"v15Score":n,"winner":"baseline"|"v15"|"tie","rationale":"...","baselineImprovements":[],"v15Improvements":[]}\n\nQ:\n${opts.question}\n\nA:\n${opts.baselineAnswer.slice(0, 5000)}\n\nB:\n${opts.v15Answer.slice(0, 5000)}`,
      maxOutputTokens: 1200,
    });
    attempts++;
    if (res.ok) {
      const m = res.text.replace(/```json\s*/gi, "").replace(/```/g, "").match(/\{[\s\S]*\}/);
      const j = JSON.parse(m ? m[0] : res.text);
      const b = Math.max(0, Math.min(10, Number(j.baselineScore) || 0));
      const v = Math.max(0, Math.min(10, Number(j.v15Score) || 0));
      return {
        baselineScore: b,
        v15Score: v,
        gap: Math.round((v - b) * 100) / 100,
        winner: v > b ? "v15" : v < b ? "baseline" : "tie",
        baselineImprovements: Array.isArray(j.baselineImprovements) ? j.baselineImprovements.map(String).slice(0, 6) : [],
        v15Improvements: Array.isArray(j.v15Improvements) ? j.v15Improvements.map(String).slice(0, 6) : [],
        rationale: String(j.rationale ?? "").slice(0, 700),
        judgeModel: res.modelUsed,
        ok: true,
        rotationAttempts: attempts,
      };
    }
    lastErr = res.error || lastErr;
  } catch (e: any) {
    lastErr = e?.message || lastErr;
  }

  return {
    baselineScore: 0,
    v15Score: 0,
    gap: 0,
    winner: "tie",
    baselineImprovements: [],
    v15Improvements: [],
    rationale: `Independent judge unavailable after ${tried.size} model attempt(s). Last error: ${lastErr}`,
    judgeModel: "rotation-exhausted",
    ok: false,
    error: lastErr,
    rotationAttempts: attempts,
  };
}

// silence unused import warning if bundler tree-shakes geminiGenerate
void geminiGenerate;
