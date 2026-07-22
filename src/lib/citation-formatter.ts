/**
 * Deterministic citation formatter (Turn 15).
 *
 * Converts the pipeline's internal, auditable `[S#]` provenance markers into a
 * user-selected citation style with BOTH:
 *   1. an inline form placed exactly where the `[S#]` marker already sits
 *      (i.e. immediately after the cited/paraphrased text), and
 *   2. a fully-formatted end-of-document reference/bibliography section.
 *
 * Only TRUSTED ledger entries are rendered. Any `[S#]` whose ledger entry is
 * missing or untrusted is dropped before this stage (see v15-pipeline shim),
 * so nothing unconfirmed can reach the final draft.
 *
 * Honesty note: package ledger entries carry {title, url, snippet, timestamp}
 * but not a parsed author/year. This formatter derives author/host and access
 * date deterministically from available metadata and marks unknown fields as
 * "n.d." (APA/Chicago) rather than fabricating an author or publication year.
 */
import type { CitationStyle } from "@/lib/template-requirements";

export interface LedgerEntryLike {
  id: number;
  title?: string;
  url?: string;
  snippet?: string;
  timestamp?: number;
}

interface TrustRow {
  id: number;
  trusted: boolean;
  tag: string;
}

const STYLE_HEADING: Record<CitationStyle, string> = {
  APA: "References",
  MLA: "Works Cited",
  Chicago: "Bibliography",
  IEEE: "References",
  AMA: "References",
};

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function accessDate(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}

function yearOf(_ts?: number, title?: string): string {
  // Prefer a year found in the title; never invent a publication year from
  // retrieval timestamp (that caused "(Doi, 2026)" style fabrications).
  const fromTitle = (title || "").match(/\b(19|20)\d{2}\b/);
  if (fromTitle) return fromTitle[0];
  return "n.d.";
}

const BAD_HOSTS = new Set([
  "doi", "org", "com", "net", "io", "gov", "edu", "co", "uk", "us", "de", "fr",
  "doi.org", "dx.doi.org", "pubmed", "ncbi", "nlm", "nih",
]);

/** Short author/organization surrogate: prefer title, never bare TLD/DOI hosts. */
function orgLabel(entry: LedgerEntryLike): string {
  // Prefer a human-readable title first when available
  const t = (entry.title || "").trim();
  if (t.length > 3 && !/^(untitled|unknown|source|doi|http)/i.test(t)) {
    // Use first 1-3 significant words of the title as author/org surrogate
    const words = t.replace(/[^A-Za-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
    if (words.length >= 1) return words.slice(0, Math.min(3, words.length)).join(" ");
  }
  const host = hostOf(entry.url);
  const hostLower = host.toLowerCase();
  const hostCore = hostLower.split(".")[0] || hostLower;
  if (
    host &&
    host.length > 4 &&
    !/^\d/.test(host) &&
    !BAD_HOSTS.has(hostLower) &&
    !BAD_HOSTS.has(hostCore) &&
    !hostLower.endsWith("doi.org")
  ) {
    const core = host.split(".").slice(0, -1).join(" ") || host;
    return core.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Source";
}

function cleanTitle(entry: LedgerEntryLike): string {
  return (entry.title || "Untitled source").replace(/\s+/g, " ").trim();
}

/** Inline form used to REPLACE a `[S#]` marker in-body. */
function inlineForm(style: CitationStyle, ordinal: number, entry: LedgerEntryLike): string {
  switch (style) {
    case "IEEE":
    case "AMA":
      return `[${ordinal}]`;
    case "MLA":
      return `(${orgLabel(entry)})`;
    case "Chicago":
      return `(${orgLabel(entry)} ${yearOf(entry.timestamp, entry.title)})`;
    case "APA":
    default:
      return `(${orgLabel(entry)}, ${yearOf(entry.timestamp, entry.title)})`;
  }
}

/** One reference-list line, keyed to the assigned ordinal. */
function referenceLine(style: CitationStyle, ordinal: number, entry: LedgerEntryLike): string {
  const title = cleanTitle(entry);
  const org = orgLabel(entry);
  const url = entry.url || "";
  const year = yearOf(entry.timestamp, entry.title);
  const acc = accessDate(entry.timestamp);
  switch (style) {
    case "IEEE":
      return `[${ordinal}] ${org}, "${title}," ${url ? url + ", " : ""}accessed ${acc}.`;
    case "AMA":
      return `${ordinal}. ${org}. ${title}. ${url ? "Available at: " + url + ". " : ""}Accessed ${acc}.`;
    case "MLA":
      return `${org}. "${title}." ${hostOf(url) || "n.p."}, ${url ? url + ". " : ""}Accessed ${acc}.`;
    case "Chicago":
      return `${org}. "${title}." Accessed ${acc}. ${url}.`;
    case "APA":
    default:
      return `${org}. (${year}). ${title}. ${url ? "Retrieved " + acc + ", from " + url : ""}`.trim();
  }
}

export interface FormatResult {
  text: string;
  referenceCount: number;
  style: CitationStyle;
  headingUsed: string;
}

/**
 * Format an already-sanitized draft. `trustRows` describes which `[S#]`
 * markers survived the trust audit; `ledger` provides the entry metadata.
 * Markers absent from `trustRows` (or with trusted=false) are removed.
 */
export function formatCitations(
  text: string,
  style: CitationStyle,
  trustRows: TrustRow[],
  ledger: LedgerEntryLike[]
): FormatResult {
  const heading = STYLE_HEADING[style] || "References";
  const trustedIds = new Set(trustRows.filter((r) => r.trusted).map((r) => r.id));
  const ledgerById = new Map(ledger.map((e) => [e.id, e]));

  // Determine ordering: first appearance in body among trusted ids.
  const appearance: number[] = [];
  const seen = new Set<number>();
  const markerRe = /\[S(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(text)) !== null) {
    const id = Number(m[1]);
    if (trustedIds.has(id) && ledgerById.has(id) && !seen.has(id)) {
      seen.add(id);
      appearance.push(id);
    }
  }

  // Assign sequential ordinals in appearance order (IEEE/AMA need this).
  const ordinalOf = new Map<number, number>();
  appearance.forEach((id, i) => ordinalOf.set(id, i + 1));

  // Replace every marker: trusted -> inline form; untrusted/missing -> drop.
  let body = text.replace(/\[S(\d+)\]/g, (_full, d) => {
    const id = Number(d);
    if (!trustedIds.has(id) || !ledgerById.has(id)) return "";
    const ordinal = ordinalOf.get(id) || 1;
    return inlineForm(style, ordinal, ledgerById.get(id)!);
  });

  // Tidy spacing left by removed markers.
  body = body.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trimEnd();

  // Strip any pre-existing References/Works Cited/Bibliography block the model
  // may have written, so the deterministic one is authoritative.
  body = body.replace(
    /\n+#{0,6}\s*(References|Works Cited|Bibliography|Sources)\s*:?[\s\S]*$/i,
    "\n"
  ).trimEnd();

  if (appearance.length === 0) {
    return { text: body, referenceCount: 0, style, headingUsed: heading };
  }

  const lines = appearance.map((id, i) =>
    referenceLine(style, i + 1, ledgerById.get(id)!)
  );
  const refSection = `\n\n## ${heading}\n\n${lines.join("\n")}\n`;
  return {
    text: body + refSection,
    referenceCount: appearance.length,
    style,
    headingUsed: heading,
  };
}
