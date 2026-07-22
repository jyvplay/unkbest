/**
 * Core Scraper Hardener Base Implementation
 */
export interface ProxyDef {
  name: string;
  build: (url: string) => string;
  unwrap?: (body: string) => string;
}

const jsonContents = (b: string) => {
  try { return JSON.parse(b)?.contents || b; } catch { return b; }
};

export const PROXY_FLEET: ProxyDef[] = [
  { name: "corsproxy.io", build: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}` },
  { name: "allorigins-raw", build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: "codetabs", build: (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}` },
  { name: "cors.sh", build: (u) => `https://proxy.cors.sh/${u}` },
  { name: "yacdn", build: (u) => `https://yacdn.org/proxy/${u}` },
  { name: "whateverorigin", build: (u) => `https://whateverorigin.org/get?url=${encodeURIComponent(u)}`, unwrap: jsonContents },
];

export function extractTextFromHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRobust(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const res = await fetch(url, { signal, headers: { "User-Agent": "Mozilla/5.0 Veritas/1.0" } });
    if (res.ok) return await res.text();
  } catch {}

  for (const proxy of PROXY_FLEET) {
    try {
      const res = await fetch(proxy.build(url), { signal });
      if (res.ok) {
        const raw = await res.text();
        return proxy.unwrap ? proxy.unwrap(raw) : raw;
      }
    } catch {}
  }
  throw new Error(`Fleet exhausted for ${url}`);
}

export async function robustFetch(url: string, signal?: AbortSignal): Promise<string> {
  return fetchRobust(url, signal);
}
