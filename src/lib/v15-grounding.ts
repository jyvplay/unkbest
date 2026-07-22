/**
 * Persistent grounding override — prioritizes non-academic, industry, news,
 * and forum sources before academic-only fallbacks.
 *
 * Package pipeline still imports its own relative grounding module. This module
 * is used by the workspace pipeline shim for additive re-grounding when the
 * package pass returns academic-heavy or empty evidence.
 */
export * from "./v15-grounding.base";
import { groundQuestion as packageGround } from "./v15-grounding.base";
import { enhancedSearch } from "@/lib/scraper-enhanced";

export type GroundingBackends = {
  ogScraper?: boolean;
  prismafetch?: boolean;
  jina?: boolean;
  searxng?: boolean;
  nativeScraper?: boolean;
};

export interface GroundingResult {
  ok: boolean;
  provider: string;
  count: number;
  evidenceBlock: string;
  sources: { title: string; url: string; content: string }[];
  error?: string;
}

const ACADEMIC_HOST =
  /pubmed|nih\.gov|arxiv|semanticscholar|openalex|crossref|doi\.org|jstor|springer|sciencedirect|wiley|nature\.com|science\.org|biorxiv|ssrn/i;

function isAcademic(url: string): boolean {
  return ACADEMIC_HOST.test(url || "");
}

/**
 * Prefer industry/news/forum sources first; keep academic as supplement.
 * Falls back to package grounder so existing routes remain intact.
 */
export async function groundQuestion(opts: {
  question: string;
  backends?: GroundingBackends;
  depth?: number;
  onDebug?: (m: string) => void;
}): Promise<GroundingResult> {
  const depth = opts.depth ?? 6;
  const onDebug = opts.onDebug;

  // 1) Fast vertical APIs (HN, SE, Reddit, GitHub, patents, etc.)
  try {
    onDebug?.("vertical-first: industry/news/forums before academic-only");
    const hits = await enhancedSearch(opts.question, {
      maxResults: depth * 3,
      includeAcademic: true,
      includeIndustry: true,
      includeForums: true,
      engines: ["duckduckgo", "bing", "google"],
    });
    const mapped = hits
      .map((h) => ({
        title: h.title || "Untitled",
        url: h.url || "",
        content: (h.snippet || "").slice(0, 900),
      }))
      .filter((s) => s.url);

    // Prefer non-academic first, then fill with academic
    const nonAcad = mapped.filter((s) => !isAcademic(s.url));
    const acad = mapped.filter((s) => isAcademic(s.url));
    const ordered = [...nonAcad, ...acad].slice(0, depth * 2);

    if (ordered.length > 0) {
      // If we have at least 2 non-academic sources, use them as primary
      if (nonAcad.length >= 2) {
        const sources = ordered;
        onDebug?.(`vertical-first: ${nonAcad.length} non-academic + ${acad.length} academic`);
        return {
          ok: true,
          provider: "vertical-first(industry+news+forums)",
          count: sources.length,
          sources,
          evidenceBlock:
            `LIVE RETRIEVED EVIDENCE (vertical-first, ${sources.length} sources; cite only these [S#]):\n` +
            sources
              .map((s, i) => `[S${i + 1}] ${s.title}\nURL: ${s.url}\n${s.content}`)
              .join("\n---\n"),
        };
      }
    }
  } catch (e: any) {
    onDebug?.(`vertical-first failed: ${e?.message ?? "error"}`);
  }

  // 2) Package grounder (native/OG/SearXNG/Prisma/Jina) — full original fleet
  const pkg = await packageGround(opts);
  if (pkg.ok) {
    // Re-order package results: non-academic first
    const nonAcad = pkg.sources.filter((s) => !isAcademic(s.url));
    const acad = pkg.sources.filter((s) => isAcademic(s.url));
    const reordered = [...nonAcad, ...acad];
    if (reordered.length && nonAcad.length > 0) {
      return {
        ...pkg,
        provider: `${pkg.provider}+non-academic-priority`,
        sources: reordered,
        evidenceBlock:
          `LIVE RETRIEVED EVIDENCE (${pkg.provider}+non-academic-priority, ${reordered.length} sources; cite only these [S#]):\n` +
          reordered
            .map((s, i) => `[S${i + 1}] ${s.title}\nURL: ${s.url}\n${s.content}`)
            .join("\n---\n"),
      };
    }
    return pkg;
  }

  // 3) Last resort: vertical search including academic
  try {
    const hits = await enhancedSearch(opts.question, {
      maxResults: depth * 2,
      includeAcademic: true,
      includeIndustry: true,
      includeForums: true,
    });
    const sources = hits
      .map((h) => ({
        title: h.title || "Untitled",
        url: h.url || "",
        content: (h.snippet || "").slice(0, 900),
      }))
      .filter((s) => s.url)
      .slice(0, depth * 2);
    if (sources.length) {
      return {
        ok: true,
        provider: "vertical-fallback",
        count: sources.length,
        sources,
        evidenceBlock:
          `LIVE RETRIEVED EVIDENCE (vertical-fallback, ${sources.length} sources; cite only these [S#]):\n` +
          sources
            .map((s, i) => `[S${i + 1}] ${s.title}\nURL: ${s.url}\n${s.content}`)
            .join("\n---\n"),
      };
    }
  } catch {
    /* ignore */
  }

  return pkg;
}
