// Task #263 + #268: silent server-side geocoding via Nominatim/OpenStreetMap.
// Operators only enter a postal address; we resolve lat/lng best-effort so the
// public "Find nearest to me" feature can sort by haversine distance.
//
// Task #268: only persist coordinates when Nominatim returns a street-level
// match. Area-level matches like "Miami Beach, FL" or "Detroit, MI" are
// dropped so the public "Directions" button stays hidden — area coords led
// people to the wrong place.
//
// Task #282: tiered proximity sort — city-center geocoding for fallback tiers.
//
// Task #291: the original precision heuristic was too strict — Nominatim very
// often returns valid street-level hits tagged `road`, `place`, `residential`,
// etc., with the house number nested in `display_name` rather than
// `address.house_number`, so the old whitelist returned `null` and confirmed
// good addresses never got coords. The relaxed heuristic accepts those shapes
// when there's a numeric house-number context in the original query or in the
// returned display name. Also exposes the best candidate to the caller (even
// when it's area-level) so the admin re-geocode flow can offer "Use this
// match anyway" instead of forcing manual lat/lng entry.
//
// Notes:
//  - Nominatim usage policy: <= 1 req/sec, must set a descriptive User-Agent.
//  - Never throw to caller — geocoding failures must not break create/update.
//  - In-process result cache (address -> coords) to avoid re-hitting the API
//    when an admin saves a row without changing the address.

import { storage } from "./storage.js";

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

// Detailed result returned from the admin re-geocode flow. When the geocoder
// can't find a street-level match it still returns the best area-level
// candidate so the UI can offer to accept it.
export interface DetailedGeocodeResult {
  precise: GeocodeResult | null;
  // Best Nominatim row we saw, regardless of precision. Null only when
  // Nominatim returned zero rows (or the upstream call failed).
  bestCandidate: {
    latitude: number;
    longitude: number;
    displayName: string;
    addressType: string | null;
    class: string | null;
  } | null;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "BabyBanzEarmuffsGemach/1.0 (admin@earmuffsgemach.com)";
const MIN_INTERVAL_MS = 1100; // be polite — slightly over 1 req/sec

// Task #291: Nominatim address-result categories considered "street-level"
// directly (no extra checks). These rows pinpoint a building or named POI.
const PRECISE_ADDRESS_TYPES = new Set([
  "house", "building", "amenity", "shop", "office",
  "school", "hospital", "place_of_worship", "synagogue",
]);
const PRECISE_CLASSES = new Set([
  "building", "amenity", "shop", "office",
]);

// Task #291: rows tagged as a street/road. We promote these to "precise"
// when the original query (or display_name) carries a numeric house number,
// since Nominatim often resolves "123 Main St" to a row whose addresstype is
// "road" instead of "house". These are the safe types — they represent
// actual street geometry.
const STREET_ADDRESS_TYPES = new Set(["road", "residential"]);

// Task #291: weaker tier — neighbourhood/village/hamlet/place. These are
// area-ish but small. Only promote to precise when the *query itself* (not
// just the returned display_name, which always contains numeric postcodes)
// has a house-number-shaped token, AND the row also reports a postcode or
// road in its address details. This avoids treating "Five Towns, NY" or
// "Jerusalem, Israel" as precise just because the display name contains a
// ZIP-like number.
const WEAK_STREET_ADDRESS_TYPES = new Set([
  "place", "village", "hamlet", "neighbourhood",
]);

// Rows that are obviously area-only and should never be treated as precise
// no matter how the query is phrased.
const AREA_ADDRESS_TYPES = new Set([
  "city", "town", "state", "county", "country", "region", "province",
  "municipality", "postcode", "administrative",
]);

const cache = new Map<string, GeocodeResult | null>();
let lastRequestAt = 0;
// Serialize all outbound requests so concurrent callers cannot overlap inside
// the 1 req/sec window. Each new request chains onto the tail of this promise.
let requestQueue: Promise<void> = Promise.resolve();

function normalize(address: string): string {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}

async function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Acquire a serialized slot honoring the >=1.1s gap between requests.
async function acquireSlot(): Promise<void> {
  const myTurn = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < MIN_INTERVAL_MS) {
      await wait(MIN_INTERVAL_MS - elapsed);
    }
    lastRequestAt = Date.now();
  });
  // Swallow errors so a single failure doesn't poison the chain.
  requestQueue = myTurn.catch(() => undefined);
  return myTurn;
}

interface NominatimRow {
  lat?: string;
  lon?: string;
  class?: string;
  type?: string;
  addresstype?: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    postcode?: string;
    [k: string]: unknown;
  };
}

// Task #291: did the original query carry a house-number-shaped token in its
// first 80 chars? Restricted to the user-entered query (not display_name) to
// avoid being fooled by ZIP codes that Nominatim always tacks onto the end of
// every display name regardless of precision.
function queryHasHouseNumber(query: string): boolean {
  return /\b\d{1,5}[A-Za-z]?\b/.test((query || "").slice(0, 80));
}

// Same test against the display name, but only used for street-typed rows
// (road/residential), where a numeric token strongly correlates with a real
// house number — area-typed rows always contain a ZIP suffix and would slip
// through if we considered display_name for them.
function displayNameHasHouseNumber(displayName: string | undefined): boolean {
  return /\b\d{1,5}[A-Za-z]?\b/.test((displayName || "").slice(0, 80));
}

function isPrecise(row: NominatimRow, query: string): boolean {
  const at = row.addresstype?.toLowerCase() ?? null;
  const cls = row.class?.toLowerCase() ?? null;

  // Hard-reject obviously area-level rows even if the query had a number.
  if (at && AREA_ADDRESS_TYPES.has(at)) return false;

  // Exact house number returned by Nominatim — always precise.
  if (row.address?.house_number) return true;

  // Named building / amenity / etc.
  if (at && PRECISE_ADDRESS_TYPES.has(at)) return true;
  if (cls && PRECISE_CLASSES.has(cls)) return true;

  // Street-level row (road/residential, or class=highway) + numeric house
  // number in the query OR in the row's display_name → accept. Streets are
  // safe: a row tagged "road" with a number nearby is genuinely street-level.
  if ((at && STREET_ADDRESS_TYPES.has(at)) || cls === "highway") {
    if (queryHasHouseNumber(query) || displayNameHasHouseNumber(row.display_name)) {
      return true;
    }
    return false;
  }

  // Weak street-ish types (neighbourhood/village/hamlet/place) — only accept
  // when the *query* clearly has a house number AND Nominatim resolved an
  // actual road or postcode in its address detail. This blocks "Five Towns,
  // NY" style hits where the row is small but still area-level.
  if (at && WEAK_STREET_ADDRESS_TYPES.has(at)) {
    if (!queryHasHouseNumber(query)) return false;
    if (row.address?.road || row.address?.postcode) return true;
    return false;
  }

  return false;
}

// Clear the in-process cache entry for a given address. Used when an admin
// triggers a re-geocode and we want to force a fresh hit on Nominatim.
export function clearGeocodeCacheForAddress(address: string): void {
  if (!address || typeof address !== "string") return;
  cache.delete(normalize(address));
}

async function fetchNominatimRows(address: string): Promise<NominatimRow[]> {
  await acquireSlot();
  const url = `${NOMINATIM_URL}?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(address)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimRow[];
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

function rowToCoords(row: NominatimRow): GeocodeResult | null {
  if (!row?.lat || !row?.lon) return null;
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

export async function geocodeAddress(
  address: string,
  options: { force?: boolean } = {},
): Promise<GeocodeResult | null> {
  if (!address || typeof address !== "string") return null;
  const key = normalize(address);
  if (options.force) {
    cache.delete(key);
  } else if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  try {
    const rows = await fetchNominatimRows(address);
    // Task #268: ask for several candidates and pick the first street-level
    // one. Nominatim's top hit for "123 Main St, Brooklyn" is often the
    // city-level result, with the actual street lower in the list.
    const preciseRow = rows.find((row) => row?.lat && row?.lon && isPrecise(row, address));
    if (!preciseRow) {
      // Task #291: leave a single targeted log line so future regressions are
      // debuggable from production logs without having to add print debugging.
      const top = rows[0];
      console.log(
        `[geocoder] precise match rejected for "${address}" — top row addresstype=${top?.addresstype ?? "?"} class=${top?.class ?? "?"}`,
      );
      cache.set(key, null);
      return null;
    }
    const coords = rowToCoords(preciseRow);
    if (!coords) {
      cache.set(key, null);
      return null;
    }
    console.log(
      `[geocoder] precise match accepted for "${address}" — addresstype=${preciseRow.addresstype ?? "?"} class=${preciseRow.class ?? "?"}`,
    );
    cache.set(key, coords);
    return coords;
  } catch (err) {
    console.warn(`[geocoder] failed for "${address}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// Task #291: detailed lookup used by the admin re-geocode flow. Always reports
// the best candidate (even area-level) so the UI can offer "Use this match"
// when the precision filter rejects everything.
export async function geocodeAddressDetailed(address: string): Promise<DetailedGeocodeResult> {
  if (!address || typeof address !== "string") {
    return { precise: null, bestCandidate: null };
  }
  // Bypass cache — admins use this when something looks wrong, and the
  // cached value may be null from an earlier strict pass.
  cache.delete(normalize(address));
  try {
    const rows = await fetchNominatimRows(address);
    if (rows.length === 0) {
      console.log(`[geocoder] precise match rejected for "${address}" — no results`);
      return { precise: null, bestCandidate: null };
    }
    const preciseRow = rows.find((row) => row?.lat && row?.lon && isPrecise(row, address));
    let precise: GeocodeResult | null = null;
    if (preciseRow) {
      precise = rowToCoords(preciseRow);
      if (precise) {
        cache.set(normalize(address), precise);
        console.log(
          `[geocoder] precise match accepted for "${address}" — addresstype=${preciseRow.addresstype ?? "?"} class=${preciseRow.class ?? "?"}`,
        );
      }
    } else {
      console.log(
        `[geocoder] precise match rejected for "${address}" — top row addresstype=${rows[0]?.addresstype ?? "?"} class=${rows[0]?.class ?? "?"}`,
      );
    }
    // Best candidate = the precise row if we have one, otherwise the first
    // row that has coordinates at all (even area-level).
    const candidateRow = preciseRow ?? rows.find((row) => row?.lat && row?.lon) ?? null;
    let bestCandidate: DetailedGeocodeResult["bestCandidate"] = null;
    if (candidateRow) {
      const coords = rowToCoords(candidateRow);
      if (coords) {
        bestCandidate = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          displayName: candidateRow.display_name?.trim() || address,
          addressType: candidateRow.addresstype ?? null,
          class: candidateRow.class ?? null,
        };
      }
    }
    return { precise, bestCandidate };
  } catch (err) {
    console.warn(`[geocoder] detailed lookup failed for "${address}": ${err instanceof Error ? err.message : String(err)}`);
    return { precise: null, bestCandidate: null };
  }
}

// Fire-and-forget geocode + persist. Called from create/update location paths
// when the address changes.
export function geocodeAndStore(locationId: number, address: string): void {
  void (async () => {
    const coords = await geocodeAddress(address);
    if (!coords) return;
    try {
      await storage.updateLocation(locationId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        geocodedAt: new Date(),
      });
    } catch (err) {
      console.warn(`[geocoder] failed to persist coords for location ${locationId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();
}

// Task #291: bump flag key so the relaxed heuristic re-runs once on deploy.
// V1 = Task #268 strict pass (over-zealous, cleared too much).
// V2 = Task #282 fixed-heuristic pass.
// V3 = relax: re-evaluate cleared rows under the new precision rules, then
//      backfillMissingGeocodes will repopulate anything still missing.
const STRICT_FLAG_KEY = "geocoder.strictRevalidationV3DoneAt";

// Task #268 / #282 / #291: one-time pass on startup. Clears coordinates on
// existing locations whose address has *no* digits in the first 80 chars,
// because those queries can never produce a precise hit under the relaxed
// heuristic either (no house number context = area-level only).
async function clearLegacyImpreciseCoords(): Promise<number> {
  const all = await storage.getAllLocations();
  // Look for any digit run in the first 80 chars. Real street addresses
  // always have a house number somewhere near the front.
  const hasHouseNumber = (addr: string): boolean => /\d/.test(addr.slice(0, 80));
  let cleared = 0;
  for (const loc of all) {
    if (loc.latitude == null || loc.longitude == null) continue;
    if (hasHouseNumber(loc.address || "")) continue;
    try {
      await storage.updateLocation(loc.id, {
        latitude: null,
        longitude: null,
        geocodedAt: null,
      });
      cleared += 1;
    } catch (err) {
      console.warn(`[geocoder] failed to clear stale coords for ${loc.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return cleared;
}

// One-shot backfill on startup. Rate-limited by the global throttle above.
export async function backfillMissingGeocodes(): Promise<void> {
  try {
    // Task #268 / #282 / #291: first-run strict revalidation under V3 — clear
    // stale area-level coords once, then let the precision-filtered backfill
    // repopulate (now using the relaxed heuristic).
    try {
      const flag = await storage.getGlobalSetting(STRICT_FLAG_KEY);
      if (!flag?.value) {
        // Claim the flag *before* running the expensive pass so a concurrent
        // startup on another instance skips it. If the pass fails partway,
        // an admin can clear the flag in global_settings to re-run.
        await storage.setGlobalSetting(STRICT_FLAG_KEY, new Date().toISOString());
        const cleared = await clearLegacyImpreciseCoords();
        if (cleared > 0) {
          console.log(`[geocoder] strict revalidation v3: cleared ${cleared} area-level coordinate(s).`);
        }
      }
    } catch (err) {
      console.warn(`[geocoder] strict revalidation skipped: ${err instanceof Error ? err.message : String(err)}`);
    }

    const all = await storage.getAllLocations();
    const missing = all.filter((l) => l.latitude == null && l.address && l.address.trim().length > 0);
    if (missing.length === 0) return;
    console.log(`[geocoder] backfilling ${missing.length} location(s) missing coordinates…`);
    let ok = 0;
    for (const loc of missing) {
      const coords = await geocodeAddress(loc.address);
      if (!coords) continue;
      try {
        await storage.updateLocation(loc.id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          geocodedAt: new Date(),
        });
        ok += 1;
      } catch (err) {
        console.warn(`[geocoder] backfill persist failed for ${loc.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`[geocoder] backfill complete: ${ok}/${missing.length} succeeded.`);
  } catch (err) {
    console.warn(`[geocoder] backfill aborted: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Task #282: City-center geocoding for tiered proximity fallback.
// These are rough "city, region" query results — not street-level. We accept
// area-level results here (unlike geocodeAddress which requires precision).
// Results are cached in memory; no DB persistence needed.
// ---------------------------------------------------------------------------

interface CityCenter {
  lat: number;
  lon: number;
}

// cityId → center coords, or { failedAt } for failed lookups (TTL-based retry).
const CITY_CENTER_RETRY_MS = 4 * 60 * 60 * 1000; // retry failed lookups after 4 h
type CityCenterEntry = CityCenter | { failedAt: number };
const cityCenterCache = new Map<number, CityCenterEntry>();

function getCityCenter(cityId: number): CityCenter | null {
  const entry = cityCenterCache.get(cityId);
  if (!entry) return null;
  if ("failedAt" in entry) return null;
  return entry;
}

function cityCenterCached(cityId: number): boolean {
  const entry = cityCenterCache.get(cityId);
  if (!entry) return false;
  if ("failedAt" in entry) {
    // Allow retry after TTL
    return Date.now() - entry.failedAt < CITY_CENTER_RETRY_MS;
  }
  return true;
}

async function fetchCityCenter(cityName: string, regionName: string): Promise<CityCenter | null> {
  const query = `${cityName}, ${regionName}`;
  try {
    await acquireSlot();
    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const row = data[0];
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

// Returns true if any city categories have uncached or expired-failure entries.
// Used by the location-tree endpoint to decide whether to trigger a background retry.
export function hasMissingCityCenters(): boolean {
  // This is a cheap synchronous check — callers use it to gate a background refresh.
  // We can only check against the current cache; the full city list is in the DB.
  // If the cache is empty or any entry has an expired failure, return true.
  if (cityCenterCache.size === 0) return true;
  for (const [, entry] of cityCenterCache) {
    if ("failedAt" in entry && Date.now() - entry.failedAt >= CITY_CENTER_RETRY_MS) {
      return true;
    }
  }
  return false;
}

// Return whatever city centers are currently cached. Called from the
// location-tree endpoint — returns partial results while backfill runs.
export function getCachedCityCenters(): Record<number, CityCenter> {
  const out: Record<number, CityCenter> = {};
  for (const [id] of cityCenterCache) {
    const center = getCityCenter(id);
    if (center != null) out[id] = center;
  }
  return out;
}

// Fire-and-forget: geocode city centers for all known city categories. Called
// once at startup, after the location backfill. Rate-limited by the shared
// Nominatim throttle.
export async function backfillCityCenters(): Promise<void> {
  try {
    const [cityCategories, regions] = await Promise.all([
      storage.getAllCityCategories(),
      storage.getAllRegions(),
    ]);
    const regionMap = new Map(regions.map(r => [r.id, r.name]));
    const todo = cityCategories.filter(c => !cityCenterCached(c.id));
    if (todo.length === 0) return;
    console.log(`[geocoder] geocoding ${todo.length} city center(s) for tiered proximity…`);
    let ok = 0;
    for (const city of todo) {
      const regionName = regionMap.get(city.regionId) ?? "";
      const center = await fetchCityCenter(city.name, regionName);
      cityCenterCache.set(city.id, center ?? { failedAt: Date.now() });
      if (center) ok += 1;
    }
    console.log(`[geocoder] city centers: ${ok}/${todo.length} resolved.`);
  } catch (err) {
    console.warn(`[geocoder] city center backfill aborted: ${err instanceof Error ? err.message : String(err)}`);
  }
}
