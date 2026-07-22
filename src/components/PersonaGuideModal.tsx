/** Williams Persona Guide - screenshot-aligned menu/detail view. */
import { useMemo, useState } from "react";
import { PERSONA_GUIDES, comparePersonas, getAllPersonaNames } from "@/lib/williams-persona-guide";

interface Props { open: boolean; onClose: () => void; }

const SHARED_IDEA = "A city should replace diesel buses with electric buses over five years to cut operating costs, reduce street-level pollution, and improve service reliability.";

export function PersonaGuideModal({ open, onClose }: Props) {
  const names = getAllPersonaNames();
  const [selected, setSelected] = useState("The Oracle");
  const [compareA, setCompareA] = useState("The Oracle");
  const [compareB, setCompareB] = useState("The Advocate");
  const persona = PERSONA_GUIDES.find((p) => p.name === selected) || PERSONA_GUIDES[0];
  const compareText = useMemo(() => comparePersonas([compareA, compareB], SHARED_IDEA), [compareA, compareB]);

  if (!open || !persona) return null;
  const changes = persona.whatChanges || [persona.description, "Keeps the core evidence while changing sentence shape.", "Moves emphasis toward the reader's task."];
  const suppresses = persona.whatSuppresses || ["Unnecessary repetition", "Unsupported certainty", "Unclear transitions"];

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-white p-3 sm:p-5" onClick={onClose}>
      <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between px-1 pb-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">📋 Williams Persona Guide</h2>
            <p className="text-[11px] text-zinc-500">24 archetypes · Each transforms the same idea differently · Source: Joseph M. Williams, <i>Style: Toward Clarity and Grace</i></p>
          </div>
          <button onClick={onClose} className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50">Close</button>
        </header>

        <button onClick={() => setSelected("The Oracle")} className="mb-4 w-full rounded-xl border-2 border-violet-300 bg-violet-50/80 p-4 text-left shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-700 px-3 py-1 text-[10px] font-bold text-white">THE ORACLE</span>
            <span className="text-[11px] font-bold text-violet-800">Legendary · Periodic Mastery · Menu-Level Default View</span>
            <span className="ml-auto font-mono text-[9px] text-violet-500">rarity: 1 · tier: Legendary</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-violet-900">Period mastery: every clause builds like a staircase toward the decisive final phrase. The reader must wait through carefully constructed modifiers until the last word reveals what everything before it prepared the reader to receive.</p>
          <div className="mt-3 rounded-lg bg-violet-800 p-3 font-mono text-[10px] leading-relaxed text-white"><b>Effect on same script:</b> Every clause delays the conclusion. The sentence opens with the conditions, moves through the evidence, and only then lands the recommendation.</div>
        </button>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1"><h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Archetype menu</h3><span className="font-mono text-[10px] text-zinc-400">{PERSONA_GUIDES.length} available</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PERSONA_GUIDES.map((p) => (
                <button key={p.name} onClick={() => setSelected(p.name)} className={`rounded-xl border p-3 text-left transition ${selected === p.name ? "border-violet-400 bg-violet-50 shadow-sm" : "border-zinc-200 bg-white hover:border-violet-200"}`}>
                  <div className="flex items-center gap-2"><span className={`rounded px-2 py-0.5 text-[9px] font-bold ${p.tier === "Legendary" ? "bg-violet-700 text-white" : p.tier === "Epic" ? "bg-fuchsia-600 text-white" : "bg-sky-500 text-white"}`}>{(p.tier || "Common").toUpperCase()}</span><span className="font-bold text-zinc-900">{p.name}</span></div>
                  <div className="mt-1 text-[10px] text-zinc-500">rarity: {p.rarity || "Direct"}</div>
                  <div className="mt-1 text-[10px] italic text-zinc-600">{p.cadence || p.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Persona Guide</div><h3 className="text-2xl font-bold text-zinc-950">{persona.name}</h3><p className="text-[12px] text-zinc-500">{persona.description}</p></div><button onClick={onClose} className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-bold text-zinc-700">Close</button></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-[11px] font-bold uppercase text-emerald-800">WHAT IT CHANGES</div><ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-emerald-950">{changes.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><div className="text-[11px] font-bold uppercase text-rose-800">WHAT IT SUPPRESSES</div><ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-rose-950">{suppresses.map((x, i) => <li key={i}>{x}</li>)}</ul><div className="mt-2 text-[10px] text-rose-800"><b>Cadence:</b> {persona.cadence || "Purposeful and reader-centered."}</div></div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"><div className="text-[11px] font-bold uppercase text-zinc-600">SHARED IDEA</div><p className="mt-2 text-[12px] leading-relaxed text-zinc-700">{SHARED_IDEA}</p></div>
            <div className="rounded-xl border-2 border-indigo-200 bg-white p-4"><div className="flex items-center justify-between"><div className="text-[11px] font-bold uppercase text-indigo-700">50-100 WORD TRANSFORMATION</div><span className="text-[9px] text-zinc-400">same idea, persona-specific execution</span></div><p className="mt-3 text-[13px] leading-7 text-zinc-800">{persona.sampleOutput}</p><div className="mt-2 text-right text-[9px] text-zinc-400">{persona.sampleOutput.split(/\s+/).filter(Boolean).length} words</div></div>
            <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-4"><div className="mb-2 font-bold text-fuchsia-900">Side-by-side comparison</div><div className="flex flex-wrap gap-2 text-[11px]"><label>A <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="rounded border px-2 py-1">{names.map((n) => <option key={n}>{n}</option>)}</select></label><label>B <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="rounded border px-2 py-1">{names.map((n) => <option key={n}>{n}</option>)}</select></label></div><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-[10px] text-zinc-700">{compareText}</pre></div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PersonaGuideModal;