// Task #289: Thin server-side translation service used by the admin
// auto-translate display layer. Strategy:
//
//   1. Detect source language via a Hebrew-character regex (presence of any
//      U+0590–U+05FF code point → 'he', else 'en'). The detected language is
//      a hint only — callers may also pass `from` explicitly.
//   2. Translate via MyMemory (free, no key, ~50k chars/day per email).
//   3. On any failure / rate limit, fall back to LibreTranslate's public
//      instance. If both fail, return null and let the UI render the original
//      text with a small "retry" affordance.
//
// No new secrets are required. Optional env vars:
//   - MYMEMORY_EMAIL: contact email to raise the per-IP MyMemory quota.
//   - LIBRETRANSLATE_URL: override the LibreTranslate endpoint.

const HEBREW_RANGE = /[\u0590-\u05FF]/;

export type SupportedLang = "en" | "he";

export function detectLang(text: string): SupportedLang {
  return HEBREW_RANGE.test(text) ? "he" : "en";
}

export interface TranslateResult {
  translated: string | null;
  provider: "mymemory" | "libretranslate" | null;
  error?: string;
}

const FETCH_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function tryMyMemory(text: string, from: SupportedLang, to: SupportedLang): Promise<string | null> {
  const email = process.env.MYMEMORY_EMAIL;
  const params = new URLSearchParams({
    q: text,
    langpair: `${from}|${to}`,
  });
  if (email) params.set("de", email);
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`mymemory http ${res.status}`);
  const data: any = await res.json();
  // MyMemory returns 200 even on quota errors — check responseStatus.
  const status = Number(data?.responseStatus);
  if (status && status >= 400) {
    throw new Error(`mymemory status ${status}: ${data?.responseDetails ?? "unknown"}`);
  }
  const translated: string | undefined = data?.responseData?.translatedText;
  if (!translated || typeof translated !== "string") return null;
  // MyMemory occasionally echoes the source verbatim when it has no match —
  // treat that as a "no result" so we fall through to LibreTranslate.
  if (translated.trim().toLowerCase() === text.trim().toLowerCase()) return null;
  return translated;
}

async function tryLibreTranslate(text: string, from: SupportedLang, to: SupportedLang): Promise<string | null> {
  const url = process.env.LIBRETRANSLATE_URL || "https://libretranslate.de/translate";
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
  });
  if (!res.ok) throw new Error(`libretranslate http ${res.status}`);
  const data: any = await res.json();
  const translated: string | undefined = data?.translatedText;
  if (!translated || typeof translated !== "string") return null;
  return translated;
}

export async function translate(text: string, from: SupportedLang, to: SupportedLang): Promise<TranslateResult> {
  if (!text || !text.trim()) return { translated: null, provider: null };
  if (from === to) return { translated: text, provider: null };
  const errors: string[] = [];
  try {
    const t = await tryMyMemory(text, from, to);
    if (t) return { translated: t, provider: "mymemory" };
  } catch (err) {
    errors.push(`mymemory: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    const t = await tryLibreTranslate(text, from, to);
    if (t) return { translated: t, provider: "libretranslate" };
  } catch (err) {
    errors.push(`libretranslate: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (errors.length > 0) {
    console.warn(`[translation] all providers failed for "${text.slice(0, 60)}": ${errors.join("; ")}`);
  }
  return { translated: null, provider: null, error: errors.join("; ") || "unavailable" };
}
