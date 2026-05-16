export function looksLikeStreetAddress(value: string | null | undefined): boolean {
  const raw = (value ?? "").trim();
  if (raw.length === 0) return true;
  if (raw.length < 5) return false;

  const tokens = raw.split(/[\s,./\\-]+/).filter(Boolean);

  const hasStandaloneNumber = tokens.some((tok) => /^\d{1,5}[A-Za-z\u0590-\u05FF]?$/.test(tok));

  const letterTokens = tokens.filter((tok) => /[A-Za-z\u0590-\u05FF]/.test(tok));
  const letterWordCount = letterTokens.filter((tok) => tok.length >= 2).length;

  return hasStandaloneNumber && letterWordCount >= 2;
}
