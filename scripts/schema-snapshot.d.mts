// Type declarations for scripts/schema-snapshot.mjs (Task #177).
// Kept alongside the .mjs source so server/schema-snapshot.ts can import it
// from TypeScript without `any`.

export const SNAPSHOT_PATH: string;

export function dumpSchema(databaseUrl: string): Promise<string>;

export function normalizeDump(text: string): string;

export function diffSnapshots(expected: string, actual: string): string;

export function compactDiff(diff: string, contextLines?: number): string;

export function readCommittedSnapshot(path?: string): Promise<string | null>;
