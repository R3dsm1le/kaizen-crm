/**
 * Minimal, dependency-free website text extraction used to ground
 * AI research in what a company actually says about itself.
 */
export async function fetchWebsiteText(url: string, maxChars = 6000): Promise<string> {
  const fullUrl = url.includes("://") ? url : `https://${url}`;
  const response = await fetch(fullUrl, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KaizenCRM/1.0)" },
  });
  if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
  const html = await response.text();
  return htmlToText(html).slice(0, maxChars);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(nbsp|#160);/g, " ")
    .replace(/&(amp|#38);/g, "&")
    .replace(/&(lt|#60);/g, "<")
    .replace(/&(gt|#62);/g, ">")
    .replace(/&(quot|#34);/g, '"')
    .replace(/&(#39|apos);/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
