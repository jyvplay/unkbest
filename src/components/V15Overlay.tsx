/**
 * V15Overlay — persistent workspace shell.
 * - Floating V15 pill with Calibrate / Guide / Personas
 * - Guide opens the real Williams Persona Guide modal (not calibration)
 * - Personas opens the same guide (no duplicate menu pages)
 * - Calibration opens the full package dialog via workspace re-export
 * - Citation style + Native self-test injected into calibration header
 * - Batch augment panels (Draft Stats / CoVe / Adversarial / Citation / Calc)
 */
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { V15Toggle } from "@/components/V15Toggle";
import { V15CalibrationDialog } from "./V15CalibrationDialog";
import { V15BatchAugment } from "./V15BatchAugment";
import { PersonaGuideModal } from "./PersonaGuideModal";
import { CalibrationDefaultsController, CitationStyleInjector } from "./CalibrationPolicyInjector";

export function V15Overlay() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [searxngUrl, setSearxngUrl] = useState(
    () => localStorage.getItem("veritas.v15.searxngUrl") || "http://localhost:8080"
  );
  const save = () =>
    localStorage.setItem("veritas.v15.searxngUrl", searxngUrl.trim() || "http://localhost:8080");

  return (
    <>
      <div
        className="fixed left-2 top-1/2 z-[9998] flex -translate-y-1/2 flex-col items-start gap-2"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="rounded-2xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ pointerEvents: "auto" }}
        >
          {minimized ? (
            <button
              onClick={() => setMinimized(false)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
              title="Expand V15 controls"
            >
              <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
                V15
              </span>
              <span>▲</span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-indigo-600 to-emerald-500 text-[10px] font-bold text-white">
                  V15
                </div>
                <V15Toggle />
                <button
                  onClick={() => setDialogOpen(true)}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100"
                >
                  📊 Calibrate
                </button>
                <button
                  onClick={() => setPersonaOpen(true)}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                  title="Williams Persona Guide"
                >
                  📖 Guide
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="rounded-lg border border-zinc-200 px-1.5 py-1 text-[10px] text-zinc-500 hover:bg-zinc-100"
                >
                  ▼
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-100 pt-1.5">
                <span className="text-[10px] font-bold text-zinc-600">🔍 SearXNG:</span>
                <input
                  value={searxngUrl}
                  onChange={(e) => setSearxngUrl(e.target.value)}
                  onBlur={save}
                  className="w-36 rounded border border-zinc-300 px-1 py-0.5 font-mono text-[10px]"
                  placeholder="http://localhost:8080"
                />
                <button onClick={save} className="rounded bg-zinc-100 px-1.5 text-[10px] font-bold text-zinc-700">
                  Save
                </button>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="text-[10px] text-blue-600 underline"
                >
                  setup help
                </button>
              </div>
              <div className="mt-1 text-[9px] leading-tight text-zinc-400">
                Additive · original app unchanged when OFF · 📖 Guide opens personas
              </div>
            </>
          )}
        </div>
      </div>

      <V15CalibrationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <CalibrationDefaultsController open={dialogOpen} />
      {dialogOpen && <CitationStyleInjector />}
      {/* Personas button only inside calibration header — not also in the floating pill */}
      {dialogOpen && <CalibDialogPersonaInjector onOpenPersona={() => setPersonaOpen(true)} />}
      <V15BatchAugment />
      <PersonaGuideModal open={personaOpen} onClose={() => setPersonaOpen(false)} />
    </>
  );
}

function CalibDialogPersonaInjector({ onOpenPersona }: { onOpenPersona: () => void }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let anchor: HTMLElement | null = null;
    const attach = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const advCfgBtn = buttons.find((b) => /Advanced Config/i.test(b.textContent || ""));
      if (!advCfgBtn?.parentElement) {
        setHost(null);
        return;
      }
      const container = advCfgBtn.parentElement;
      let existing = container.querySelector<HTMLElement>("[data-v15-persona-inline]");
      if (!existing) {
        existing = document.createElement("span");
        existing.setAttribute("data-v15-persona-inline", "1");
        container.insertBefore(existing, advCfgBtn);
      }
      anchor = existing;
      setHost(existing);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (anchor?.parentElement) {
        try {
          anchor.parentElement.removeChild(anchor);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => () => setHost(null), []);
  if (!host) return null;
  return createPortal(
    <button
      onClick={onOpenPersona}
      className="mr-1 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-100"
      title="Williams Persona Guide"
    >
      🎭 Personas
    </button>,
    host
  );
}

export default V15Overlay;
