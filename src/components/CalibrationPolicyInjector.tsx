import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CITATION_STYLES, type CitationStyle } from "@/lib/template-requirements";

function dialogRoot(): HTMLElement | null {
  const title = Array.from(document.querySelectorAll("h2")).find((n) => /Rigor Guard Calibration/i.test(n.textContent || ""));
  return (title?.closest("div.fixed.inset-0") as HTMLElement | null) || null;
}

function dispatchValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  if (el.value === value) return;
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setChecked(root: HTMLElement, labelNeedle: string, checked: boolean) {
  const label = Array.from(root.querySelectorAll("label")).find((n) => (n.textContent || "").toLowerCase().includes(labelNeedle.toLowerCase()));
  const input = label?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (input && input.checked !== checked) input.click();
}

/**
 * Set a numeric input whose nearest labelling text contains `labelNeedle`.
 * More robust than raw index order, which breaks when Web-grounding / SearXNG
 * config panels expand and inject extra number inputs into the DOM.
 */
function setNumberByLabel(root: HTMLElement, labelNeedle: string, value: string) {
  const needle = labelNeedle.toLowerCase();
  const label = Array.from(root.querySelectorAll("label, span")).find((n) =>
    (n.textContent || "").toLowerCase().includes(needle)
  );
  const scope = label?.closest("span, label, div") || label;
  const input =
    scope?.querySelector<HTMLInputElement>('input[type="number"]') ||
    (label?.parentElement?.querySelector<HTMLInputElement>('input[type="number"]') ?? null);
  if (input) dispatchValue(input, value);
}

/** Set a <select> whose nearest labelling text contains `labelNeedle`. */
function setSelectByLabel(root: HTMLElement, labelNeedle: string, value: string) {
  const needle = labelNeedle.toLowerCase();
  const label = Array.from(root.querySelectorAll("label, span")).find((n) =>
    (n.textContent || "").toLowerCase().includes(needle)
  );
  const scope = label?.closest("span, label, div") || label;
  const select =
    scope?.querySelector<HTMLSelectElement>("select") ||
    (label?.parentElement?.querySelector<HTMLSelectElement>("select") ?? null);
  if (select && Array.from(select.options).some((o) => o.value === value)) {
    dispatchValue(select, value);
  }
}

/** Applies defaults to the package-owned controlled inputs, not just storage. */
export function CalibrationDefaultsController({ open }: { open: boolean }) {
  useLayoutEffect(() => {
    if (!open) return;
    let attempts = 0;
    const apply = () => {
      if (attempts > 12) return;
      const root = dialogRoot();
      if (!root) return;
      // Label-anchored numeric defaults: N-Deep 3, Cluster 5, SLOOP 4,
      // Best-of-N models 1, Hypotheses 7. Anchoring by label avoids the
      // index-drift bug that occurred once SearXNG/best-of-N panels expanded
      // and injected additional number inputs into the DOM.
      setNumberByLabel(root, "N-Deep", "3");
      setNumberByLabel(root, "Cluster", "5");
      setNumberByLabel(root, "SLOOP pages", "4");
      setNumberByLabel(root, "Models (distinct", "1");
      setNumberByLabel(root, "Hypotheses", "7");
      // Label-anchored selects: Template, Style override, Williams persona.
      setSelectByLabel(root, "Template", "OMEGA-STRATEGY");
      setSelectByLabel(root, "Style override", "--bain-pe");
      setSelectByLabel(root, "Williams persona", "The Strategist");
      setChecked(root, "4-Stage", true);
      setChecked(root, "N-Deep", true);
      setChecked(root, "Cluster", true);
      setChecked(root, "SLOOP pages", true);
      setChecked(root, "Adversarial engine", true);
      setChecked(root, "Web grounding", true);
      setChecked(root, "OG scraper", true);
      // Prefer OG + SearXNG; PrismaFetch optional (local-only). Keep industry sources path open.
      setChecked(root, "PrismaFetch", false);
      setChecked(root, "Jina", false);
      setChecked(root, "SearXNG", true);
      setChecked(root, "Pack multiple outlines", true);
      setChecked(root, "Enable catalog-derived pack", true);
      setChecked(root, "Enable cutting-edge testbed gates", true);
      setChecked(root, "Single Judge", true);
      // Ensure defense/testbed toggles that appear only on Live tab are also set when present
      setChecked(root, "catalog-derived pack", true);
      setChecked(root, "cutting-edge testbed", true);
      attempts += 1;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(() => { apply(); if (attempts > 12) window.clearInterval(timer); }, 150);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [open]);
  return null;
}

/** Citation style selector lives beside the injected Personas button. */
export function CitationStyleInjector() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [style, setStyle] = useState<CitationStyle>(() => (localStorage.getItem("veritas.v15.citationStyle") as CitationStyle) || "APA");
  const [health, setHealth] = useState<"idle" | "checking" | "ok" | "down">("idle");
  useLayoutEffect(() => {
    const attach = () => {
      const root = dialogRoot();
      if (!root) return setHost(null);
      // Locate the "Advanced Config" button and insert the Cite + Native group immediately before it.
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
      const advanced = buttons.find((b) => /Advanced Config/i.test(b.textContent || ""));
      if (!advanced?.parentElement) return setHost(null);
      let anchor = advanced.parentElement.querySelector<HTMLElement>("[data-v15-citation-style]");
      if (!anchor) {
        anchor = document.createElement("span");
        anchor.setAttribute("data-v15-citation-style", "1");
        // Place before Advanced Config so the order is: Cite dropdown, Native, Personas, Advanced, Divergence
        advanced.parentElement.insertBefore(anchor, advanced);
      }
      setHost(anchor);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  if (!host) return null;
  const checkNative = async () => {
    setHealth("checking");
    try {
      const response = await fetch("/api/native-selftest", { signal: AbortSignal.timeout(5000) });
      const result = await response.json();
      setHealth(response.ok && result?.passed !== false ? "ok" : "down");
    } catch {
      setHealth("down");
    }
  };
  return createPortal(
    <span className="mr-1 inline-flex items-center gap-1">
      <label className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-800" title="Citation format is included in the template contract; source IDs remain auditable [S#].">
        Cite
        <select value={style} onChange={(e) => { const next = e.target.value as CitationStyle; setStyle(next); localStorage.setItem("veritas.v15.citationStyle", next); }} className="rounded border border-sky-200 bg-white px-1 py-0.5 text-[10px] font-mono">
          {CITATION_STYLES.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
      </label>
      <button onClick={checkNative} title="Run the native scraper self-test" className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${health === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : health === "down" ? "border-rose-300 bg-rose-50 text-rose-800" : "border-sky-300 bg-white text-sky-700"}`}>
        {health === "checking" ? "Native ..." : health === "ok" ? "Native OK" : health === "down" ? "Native down" : "Native"}
      </button>
    </span>,
    host
  );
}