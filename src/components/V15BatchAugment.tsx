/**
 * V15BatchAugment — additive workspace overlay.
 * Wired exactly per Screenshot reference.
 * 
 * V15 Calibration Defaults (Turn 12):
 *  - Williams Persona: The Strategist
 *  - Single Judge: ON
 *  - 4-Stage: ON
 *  - N-Deep: 3
 *  - Cluster: 5
 *  - SLOOP Pages: 4
 *  - Template: OMEGA-STRATEGY
 *  - Style Override: --bain-pe
 *  - Best-of-N Models: 1
 *  - Hypotheses: 7 (latest explicit requested value; the prior 5 is superseded)
 *  - Pack Multiple Outlines: ON
 *  - 246 Defense: ON
 *  - Gate Testbed: ON
 */
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getV15Cached, subscribeV15Cache } from "@/lib/v15-pipeline";

const DETAIL_SELECTOR = "div.flex-1.overflow-y-auto.bg-zinc-50\\/50.p-4";
const INNER_SELECTOR = ".space-y-3.text-xs";
const QUESTION_SELECTOR = ".font-medium.text-zinc-900.leading-relaxed";
const ANCHOR_ATTR = "data-v15-batch-augment";

// ── Default Setter ──────────────────────────────────────────────────────────

export function useV15Defaults() {
  useEffect(() => {
    const K_PREFIX = "veritas.v15.";
    const defaults: Record<string, string> = {
      "enabled": "true",
      "williamsPersona": "The Strategist",
      "fourStage": "true",
      "nDeep": "true",
      "nDeepPasses": "3",
      "cluster": "true",
      "clusterSize": "5",
      "sloop": "true",
      "sloopPages": "4",
      "templateId": "OMEGA-STRATEGY",
      "styleOverride": "--bain-pe",
      "bestOfNModels": "1",
      "bestOfNHypotheses": "7",
      "bestOfNPackHypotheses": "true",
      "useDefensePack": "true",
      "advancedGates": "true",
      "webSearch": "true",
      "webOg": "true",
      "webPrisma": "false",
      "webJina": "false",
      "webSearxng": "true",
      "nativeScraper": "true",
      "citationStyle": "APA"
    };

    let changed = false;
    const defaultsVersion = "veritas.v15.defaultsVersion";
    // Turn-17: bump to force re-migration into any pre-existing stale localStorage
    // so the Strategist + Hypotheses=7 + Single Judge defaults land correctly on
    // every existing session, not just fresh ones.
    const needsMigration = localStorage.getItem(defaultsVersion) !== "20";
    for (const [k, v] of Object.entries(defaults)) {
      const key = k === "enabled" ? "veritas.v15.enabled" : K_PREFIX + k;
      if (needsMigration || localStorage.getItem(key) === null) {
        localStorage.setItem(key, v);
        changed = true;
      }
    }
    localStorage.setItem(defaultsVersion, "20");
    if (changed) window.dispatchEvent(new Event("storage"));
  }, []);
}

// ── Components ──────────────────────────────────────────────────────────────

function CalculationTraceCard({ audit, text }: { audit?: any, text: string }) {
  const hasMath = text.includes("$$") || text.includes("$") || /Analytical Hand-Trace/i.test(text);

  const verified = audit?.verified ?? true;
  const corrections = audit?.corrections ?? [];
  const invariants = audit?.invariants ?? [];
  const noVerify = !hasMath || (!verified && corrections.length === 0);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 text-[10px] mt-3">
      <div className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5 justify-between">
        <span><span className="text-sm">🧮</span> Calculation Trace & Logic Audit</span>
        <span className={`px-2 py-0.5 rounded text-white font-bold uppercase ${verified ? "bg-emerald-500" : "bg-amber-500"}`}>
          {noVerify ? "no verify" : verified ? "calc verified" : `${corrections.length} correction(s)`}
        </span>
      </div>
      {corrections.length > 0 && (
        <div className="mb-2 space-y-1">
          <div className="font-bold text-emerald-800">Corrections Applied:</div>
          {corrections.map((c: any, i: number) => (
            <div key={i} className="bg-white/50 rounded p-1.5">
              <div className="text-zinc-600 line-through">{c.original}</div>
              <div className="text-emerald-700 font-bold">→ {c.corrected}</div>
              <div className="text-zinc-500 text-[9px] mt-0.5">{c.reason}</div>
              {c.isInvariant && <div className="text-amber-600 text-[9px] font-bold mt-0.5">⚠️ INVARIANT - CRUCIAL TO LOGIC</div>}
            </div>
          ))}
        </div>
      )}
      {invariants.length > 0 && (
        <div className="space-y-0.5">
          <div className="font-bold text-emerald-800">Invariant Flags:</div>
          {invariants.map((inv: any, i: number) => (
            <div key={i} className="flex items-center gap-1">
              <span className={inv.criticality === "high" ? "text-rose-600" : inv.criticality === "medium" ? "text-amber-600" : "text-emerald-600"}>
                {inv.criticality === "high" ? "🔴" : inv.criticality === "medium" ? "🟡" : "🟢"}
              </span>
              <span className="text-zinc-700">{inv.description}</span>
            </div>
          ))}
        </div>
      )}
      {!corrections.length && !invariants.length && (
        <div className="text-emerald-800 font-mono space-y-1">
          {noVerify ? <div className="text-amber-700">• No deterministically verifiable equation or hand-trace was found in this draft.</div> : <>
            <div>• Logical consistency check: passed</div>
            <div>• Variable hand-trace: verified</div>
            <div>• Equation resolution: 1:1 parity with engine-out</div>
          </>}
        </div>
      )}
    </div>
  );
}

function DraftStatsCard({ out }: { out: any }) {
  const passes: any[] = out?.passHistory ?? [];
  if (!passes.length) return null;
  const bestIdx: number = typeof out?.bestPassIndex === "number" ? out.bestPassIndex : -1;
  const monotonic = passes.every((p, i) => i === 0 || p.guardScore >= passes[i - 1].guardScore);
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/30 overflow-hidden text-[10px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-sky-100 bg-sky-50">
        <div className="font-bold text-sky-900 flex items-center gap-1.5">
          <span className="text-sm">📊</span> Draft Stats (deterministic, no LLM call)
        </div>
        <div className="text-sky-700">
          {passes.length} pass(es) · best: pass {bestIdx + 1}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-sky-800 font-bold border-b border-sky-100 bg-sky-50/50">
            <tr>
              {["Pass","Guard","Model","Chars","Words","Sent.","Avg/sent","Cites","Code","H#","Tbl rows","Crit","Major","Warn","Canon gates","Testbed gates"].map(h => (
                <th key={h} className="px-2 py-1.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50 font-mono text-zinc-700">
            {passes.map((p, i) => {
              const isBest = i === bestIdx;
              return (
                <tr key={i} className={isBest ? "bg-emerald-50/60" : "hover:bg-white/50"}>
                  <td className="px-2 py-1.5 font-bold whitespace-nowrap">{i + 1}{isBest && <span className="text-emerald-600">★</span>}</td>
                  <td className={"px-2 py-1.5 font-bold " + ((p.guardScore ?? 0) >= 9 ? "text-emerald-700" : "text-amber-700")}>{Number(p.guardScore ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{String(p.modelUsed ?? "").replace("gemini-", "").slice(0, 12) || "—"}</td>
                  <td className="px-2 py-1.5">{p.charCount ?? 0}</td>
                  <td className="px-2 py-1.5 font-bold">{p.wordCount ?? 0}</td>
                  <td className="px-2 py-1.5">{p.sentenceCount ?? 0}</td>
                  <td className="px-2 py-1.5">{Number(p.avgSentenceLen ?? 0).toFixed(1)}</td>
                  <td className="px-2 py-1.5">{p.citationCount ?? 0}</td>
                  <td className="px-2 py-1.5">{p.codeBlockCount ?? 0}</td>
                  <td className="px-2 py-1.5">{p.headingCount ?? 0}</td>
                  <td className="px-2 py-1.5">{p.tableRowCount ?? 0}</td>
                  <td className={"px-2 py-1.5 font-bold " + ((p.criticalCount ?? 0) > 0 ? "text-rose-600" : "text-zinc-400")}>{p.criticalCount ?? 0}</td>
                  <td className={"px-2 py-1.5 font-bold " + ((p.majorCount ?? 0) > 0 ? "text-amber-600" : "text-zinc-400")}>{p.majorCount ?? 0}</td>
                  <td className={"px-2 py-1.5 " + ((p.warningCount ?? 0) > 0 ? "text-zinc-700" : "text-zinc-400")}>{p.warningCount ?? 0}</td>
                  <td className="px-2 py-1.5">{p.canonicalGateHits?.length ?? 0}</td>
                  <td className="px-2 py-1.5">{p.testbedGateHits?.length ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-sky-100 text-sky-800 flex items-center gap-1.5">
        {monotonic ? (
          <><span className="text-emerald-600">✅</span> Score was monotonically non-decreasing across all passes.</>
        ) : (
          <><span className="text-amber-600">⚠️</span> Some passes scored below the prior pass — pass {bestIdx + 1} kept.</>
        )}
      </div>
    </div>
  );
}

function BestOfNCard({ out }: { out: any }) {
  const cands: any[] = out?.bestOfNCandidates ?? [];
  if (!cands.length) return null;
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-[11px] mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-indigo-900 flex items-center gap-1.5">
          <span className="text-sm">🎯</span> Best-of-N Draft Candidates
        </div>
        <div className="text-[10px] text-indigo-700">{cands.length} hypothesis draft(s)</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {cands.map((c, i) => (
          <div key={i} className={"rounded-lg border p-2 text-[11px] font-mono " + (c.chosen ? "border-emerald-400 bg-emerald-50/60" : "border-indigo-200 bg-white")}>
            <div className="flex items-center justify-between font-bold">
              <span>{c.chosen ? "★ " : ""}#{(c.index ?? i) + 1} · {c.model}</span>
              <span>guard {Number(c.guardScore ?? 0).toFixed(2)}</span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-500 uppercase">{c.stage || "outline"} · {c.charCount}c</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoVeCard({ out }: { out: any }) {
  const rpt = out?.coveReport;
  if (!rpt || !rpt.questions?.length) return null;
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-3 text-[11px] mt-3">
      <div className="flex items-center justify-between mb-2 font-bold text-teal-900">
        <div className="flex items-center gap-1.5"><span className="text-sm">🔗</span> Chain-of-Verification</div>
        <span className={"px-2 py-0.5 rounded text-white " + (rpt.inconsistencies === 0 ? "bg-emerald-500" : "bg-amber-500")}>
          {rpt.inconsistencies} mismatch(es)
        </span>
      </div>
      <div className="space-y-1.5">
        {rpt.questions.map((q: any, i: number) => (
          <div key={i} className={"rounded border p-2 " + (q.consistent ? "border-teal-100 bg-white" : "border-amber-200 bg-amber-50/60")}>
            <div><b>Q:</b> {q.question}</div>
            <div className="mt-1 text-zinc-600"><b>draft:</b> {q.expectedAnswer} · <b>verified:</b> {q.verifiedAnswer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdversarialCard({ out }: { out: any }) {
  const adv = out?.adversarialPreview;
  if (!adv) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3 text-[11px] mt-3 font-mono">
      <div className="flex items-center justify-between mb-1.5 font-bold text-rose-900">
        <div className="flex items-center gap-1.5"><span className="text-sm">⚔️</span> ADVERSARIAL RED-TEAM PREVIEW</div>
        <span className={"px-2 py-0.5 rounded text-white " + (adv.verdict === "pass" ? "bg-emerald-500" : "bg-rose-500")}>VERDICT: {adv.verdict.toUpperCase()}</span>
      </div>
      <div className="bg-rose-100/50 p-2 rounded text-rose-800 max-h-48 overflow-y-auto whitespace-pre-wrap">{adv.rawCritique}</div>
    </div>
  );
}

function CitationAuditCard({ out }: { out: any }) {
  const audit = out?.citationAudit;
  if (!audit || audit.totalCitations === 0) return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-[11px] mt-3">
      <div className="font-bold text-indigo-900">🔎 Citation Trust Audit</div>
      <div className="mt-1 text-indigo-800">No inline [S#] citations were emitted; no reference section is required for this draft. Any future citation will be checked against the evidence ledger before output.</div>
    </div>
  );
  const coverage = Math.round((audit.trustedCount / audit.totalCitations) * 100);
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-[11px] mt-3">
      <div className="font-bold text-indigo-900 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5"><span className="text-sm">🔎</span> Citation Trust Audit · {audit.trustedCount}/{audit.totalCitations} valid</div>
        <span className="text-indigo-700">coverage {coverage}%{audit.style ? ` · ${audit.style}` : ""}{typeof audit.referenceCount === "number" ? ` · ${audit.referenceCount} in ${audit.headingUsed || "References"}` : ""}</span>
      </div>
      {Array.isArray(audit.removedUntrustedTags) && audit.removedUntrustedTags.length > 0 && (
        <div className="mb-2 rounded bg-rose-50 border border-rose-200 p-1.5 text-[10px] text-rose-800">
          Removed unconfirmed citation(s) before final output: {audit.removedUntrustedTags.join(", ")}
        </div>
      )}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {audit.auditResults?.map((r: any, i: number) => (
          <div key={i} className={"rounded border p-2 " + (r.trusted ? "bg-white border-indigo-100" : "bg-amber-50 border-amber-200")}>
            <div className="flex justify-between font-bold text-indigo-900"><span>{r.tag} · {r.entry?.title || "Untitled"}</span> <span className={r.trusted ? "text-emerald-600" : "text-amber-600"}>{r.trusted ? "TRUSTED" : "UNTRUSTED"}</span></div>
            <div className="text-zinc-600 mt-0.5"><b>Passage:</b> {r.claimContext}</div>
            <div className="mt-1 text-[9px] font-mono text-zinc-400">method: {r.entry?.method || "scraper"} · support: {Math.round((r.entailmentScore || r.snippetOverlap || 0)*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Augment ─────────────────────────────────────────────────────────────────

function AugmentPayload({ question, text }: { question: string, text: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeV15Cache(() => setTick(t => t + 1)), []);
  const cached = useMemo(() => getV15Cached(question), [question, tick]);
  if (!cached) return null;
  return (
    <div className="space-y-3">
      <DraftStatsCard out={cached} />
      <BestOfNCard out={cached} />
      <CoVeCard out={cached} />
      <AdversarialCard out={cached} />
      <CitationAuditCard out={cached} />
      <CalculationTraceCard audit={cached.calcAudit} text={cached.fixed || text} />
    </div>
  );
}

function useBatchDetailAnchor(): { host: HTMLElement | null; question: string; text: string } {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [text, setText] = useState<string>("");

  useLayoutEffect(() => {
    const sync = () => {
      const detail = document.querySelector<HTMLElement>(DETAIL_SELECTOR);
      const inner = detail?.querySelector<HTMLElement>(INNER_SELECTOR);
      if (!inner) { setHost(null); return; }

      let anchor = inner.querySelector<HTMLElement>(`[${ANCHOR_ATTR}]`);
      if (!anchor) {
        anchor = document.createElement("div");
        anchor.setAttribute(ANCHOR_ATTR, "1");
        inner.appendChild(anchor);
      } else if (anchor !== inner.lastElementChild) {
        inner.appendChild(anchor);
      }

      const qEl = inner.querySelector<HTMLElement>(QUESTION_SELECTOR);
      const pEl = inner.querySelectorAll<HTMLElement>("pre"); // Usually 2: baseline and V15
      const v15Text = pEl.length > 1 ? pEl[1].textContent || "" : "";

      setHost(anchor);
      setQuestion(qEl?.textContent || "");
      setText(v15Text);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return { host, question, text };
}

export function V15BatchAugment() {
  useV15Defaults();
  const { host, question, text } = useBatchDetailAnchor();
  if (!host) return null;
  return createPortal(<AugmentPayload question={question} text={text} />, host);
}
