import type { Language } from "./translations";

export function pickLocalized<
  T extends Record<string, any>,
  K extends Extract<keyof T, string>,
>(record: T | null | undefined, base: K, language: Language): string {
  if (!record) return "";
  const fallback = (record[base] ?? "") as string;
  if (language !== "he") return fallback;
  const heKey = `${base}He` as keyof T;
  const heValue = record[heKey];
  if (typeof heValue === "string" && heValue.trim()) return heValue;
  return fallback;
}
