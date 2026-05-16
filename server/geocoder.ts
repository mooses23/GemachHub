// Task #263 + #268: silent server-side geocoding via Nominatim/OpenStreetMap.
// Operators only enter a postal address; we resolve lat/lng best-effort so the
// public "Find nearest to me" feature can sort by haversine distance.
//
// Task #268: only persist coordinates when Nominatim returns a street-level
// match (house_number present, or a building-class result). Area-level matches
// like "Miami Beach, FL" or "Detroit, MI" are dropped on the floor so the
// public "Directions" button stays hidden — area coords led people to the
// wrong place.
//
// Task #282: tiered proximity sort — city-center geocoding for fallback tiers.
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

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "BabyBanzEarmuffsGemach/1.0 (admin@earmuffsgemach.com)";
const MIN_INTERVAL_MS = 1100; // be polite — slightly over 1 req/sec

// Nominatim address-result categories we consider "precise enough" for
// turn-by-turn directions even when house_number is absent (e.g. a named
// building/amenity). Anything else (city, town, suburb, county, state,
// neighbourhood, etc.) is treated as area-level and discarded.
const PRECISE_ADDRESS_TYPES = new Set([
  "house", "building", "amenity", "shop", "office",
  "school", "hospital", "place_of_worship", "synagogue",
]);
const PRECISE_CLASSES = new Set([
  "building", "amenity", "shop", "office",
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
  address?: {
    house_number?: string;
    [k: string]: unknown;
  };
}

function isPrecise(row: NominatimRow): boolean {
  if (row.address?.house_number) return true;
  const at = row.addresstype?.toLowerCase();
  if (at && PRECISE_ADDRESS_TYPES.has(at)) return true;
  const cls = row.class?.toLowerCase();
  if (cls && PRECISE_CLASSES.has(cls)) return true;
  return false;
}

// Clear the in-process cache entry for a given address. Used when an admin
// triggers a re-geocode and we want to force a fresh hit on Nominatim.
export function clearGeocodeCacheForAddress(address: string): void {
  if (!address || typeof address !== "string") return;
  cache.delete(normalize(address));
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
    await acquireSlot();
    // Task #268: ask for several candidates and pick the first street-level
    // one. Nominatim's top hit for "123 Main St, Brooklyn" is often the
    // city-level result, with the actual street lower in the list.
    const url = `${NOMINATIM_URL}?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(address)}`;
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
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as NominatimRow[];
    const candidates = Array.isArray(data) ? data : [];
    const precise = candidates.find((row) => row?.lat && row?.lon && isPrecise(row));
    if (!precise) {
      // No street-level match in the top results — keep coords unset so the
      // public "Directions" button stays hidden for this gemach.
      cache.set(key, null);
      return null;
    }
    const lat = Number(precise.lat);
    const lon = Number(precise.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      cache.set(key, null);
      return null;
    }
    const result = { latitude: lat, longitude: lon };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn(`[geocoder] failed for "${address}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
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

// Task #282: bump flag key so the corrected heuristic re-runs once on deploy.
const STRICT_FLAG_KEY = "geocoder.strictRevalidationV2DoneAt";

// Task #268 / #282: one-time pass on startup. Clears coordinates on every
// existing location whose address is obviously area-level. The original
// heuristic only checked whether the address STARTS with a digit, which
// incorrectly stripped valid coords from addresses like
// "Bais Chaya Mushka, 3450 Sherbrooke St". The fixed heuristic checks
// whether a digit sequence appears anywhere in the first 80 characters of
// the address — real street addresses always have a house number somewhere
// near the front.
async function clearLegacyImpreciseCoords(): Promise<number> {
  const all = await storage.getAllLocations();
  // Fixed heuristic: look for any digit run in the first 80 chars.
  // "3450 Sherbrooke St" → has "3450" near the front → keep coords.
  // "Bais Chaya Mushka, 3450 Sherbrooke St" → has "3450" within 80 chars → keep coords.
  // "Pico Area, …" or "Detroit, MI" → no digits in first 80 chars → area-level, clear.
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
    // Task #268 / #282: first-run strict revalidation — clear stale area-level
    // coords once, then let the precision-filtered backfill repopulate.
    try {
      const flag = await storage.getGlobalSetting(STRICT_FLAG_KEY);
      if (!flag?.value) {
        // Claim the flag *before* running the expensive pass so a concurrent
        // startup on another instance skips it. If the pass fails partway,
        // an admin can clear the flag in global_settings to re-run.
        await storage.setGlobalSetting(STRICT_FLAG_KEY, new Date().toISOString());
        const cleared = await clearLegacyImpreciseCoords();
        if (cleared > 0) {
          console.log(`[geocoder] strict revalidation v2: cleared ${cleared} area-level coordinate(s).`);
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
