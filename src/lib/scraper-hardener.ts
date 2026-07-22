export * from "./scraper-hardener.base";
export async function fetchRobust(url: string, signal?: AbortSignal): Promise<string> { return ""; }

export function extractTextFromHtml(html: string): string { return html || ""; }
