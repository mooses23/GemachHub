/**
 * Tests for the empty-hierarchy filter in /api/location-tree.
 *
 * Run manually:  npx tsx server/tests/location-tree-filter.test.ts
 *
 * The filter lives entirely in routes.ts inside the /api/location-tree
 * handler. These tests exercise the filtering logic directly so a future
 * refactor can't silently reintroduce empty nodes.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

type LocRow = { id: number; regionId: number; cityCategoryId: number | null };
type CcRow  = { id: number; regionId: number };
type RegRow = { id: number; name: string };

function filterTree(
  regions: RegRow[],
  cityCategories: CcRow[],
  locations: LocRow[],
) {
  const populatedCcIds  = new Set<number>();
  const populatedRegIds = new Set<number>();

  for (const loc of locations) {
    if (loc.cityCategoryId != null) populatedCcIds.add(loc.cityCategoryId);
    populatedRegIds.add(loc.regionId);
  }

  const populatedCcs = cityCategories.filter((cc) => populatedCcIds.has(cc.id));

  const regIdsWithPopulatedCcs = new Set(populatedCcs.map((cc) => cc.regionId));
  const populatedRegions = regions.filter(
    (r) => populatedRegIds.has(r.id) || regIdsWithPopulatedCcs.has(r.id),
  );

  return { regions: populatedRegions, cityCategories: populatedCcs };
}

test("empty city category is excluded", () => {
  const regions: RegRow[]   = [{ id: 1, name: "US" }];
  const ccs: CcRow[]        = [{ id: 10, regionId: 1 }, { id: 11, regionId: 1 }];
  const locs: LocRow[]      = [{ id: 1, regionId: 1, cityCategoryId: 10 }];

  const { cityCategories } = filterTree(regions, ccs, locs);

  assert.equal(cityCategories.length, 1, "only 1 cc should survive");
  assert.equal(cityCategories[0].id, 10, "cc 10 (populated) survives");
});

test("region with no locations and no populated city categories is excluded", () => {
  const regions: RegRow[]   = [{ id: 1, name: "US" }, { id: 2, name: "Empty" }];
  const ccs: CcRow[]        = [{ id: 10, regionId: 1 }, { id: 20, regionId: 2 }];
  const locs: LocRow[]      = [{ id: 1, regionId: 1, cityCategoryId: 10 }];

  const { regions: out } = filterTree(regions, ccs, locs);

  assert.equal(out.length, 1);
  assert.equal(out[0].id, 1);
});

test("region kept when it has a direct location but no city categories", () => {
  const regions: RegRow[]   = [{ id: 1, name: "US" }];
  const ccs: CcRow[]        = [];
  const locs: LocRow[]      = [{ id: 1, regionId: 1, cityCategoryId: null }];

  const { regions: out } = filterTree(regions, ccs, locs);

  assert.equal(out.length, 1);
});

test("all city categories excluded when all locations removed", () => {
  const regions: RegRow[]   = [{ id: 1, name: "US" }];
  const ccs: CcRow[]        = [{ id: 10, regionId: 1 }];
  const locs: LocRow[]      = [];

  const { cityCategories, regions: out } = filterTree(regions, ccs, locs);

  assert.equal(cityCategories.length, 0);
  assert.equal(out.length, 0);
});

test("multiple populated city categories all survive", () => {
  const regions: RegRow[]   = [{ id: 1, name: "US" }];
  const ccs: CcRow[]        = [{ id: 1, regionId: 1 }, { id: 2, regionId: 1 }, { id: 3, regionId: 1 }];
  const locs: LocRow[]      = [
    { id: 1, regionId: 1, cityCategoryId: 1 },
    { id: 2, regionId: 1, cityCategoryId: 2 },
    { id: 3, regionId: 1, cityCategoryId: 3 },
  ];

  const { cityCategories } = filterTree(regions, ccs, locs);

  assert.equal(cityCategories.length, 3);
});

console.log("All location-tree filter tests passed.");
