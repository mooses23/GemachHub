/**
 * Tests for filterLocationTree — the shared helper used by /api/location-tree.
 *
 * Run manually:  npx tsx server/tests/location-tree-filter.test.ts
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { filterLocationTree } from "../location-tree-filter.js";

test("empty city category is excluded", () => {
  const regions    = [{ id: 1, name: "US" }];
  const ccs        = [{ id: 10, regionId: 1 }, { id: 11, regionId: 1 }];
  const locations  = [{ regionId: 1, cityCategoryId: 10 }];

  const { cityCategories } = filterLocationTree(regions, ccs, locations);

  assert.equal(cityCategories.length, 1, "only 1 cc should survive");
  assert.equal(cityCategories[0].id, 10);
});

test("region with no locations and no populated city categories is excluded", () => {
  const regions    = [{ id: 1, name: "US" }, { id: 2, name: "Empty" }];
  const ccs        = [{ id: 10, regionId: 1 }, { id: 20, regionId: 2 }];
  const locations  = [{ regionId: 1, cityCategoryId: 10 }];

  const { regions: out } = filterLocationTree(regions, ccs, locations);

  assert.equal(out.length, 1);
  assert.equal(out[0].id, 1);
});

test("region kept when it has a direct location but no city categories", () => {
  const regions    = [{ id: 1, name: "US" }];
  const ccs        = [] as { id: number; regionId: number }[];
  const locations  = [{ regionId: 1, cityCategoryId: null }];

  const { regions: out } = filterLocationTree(regions, ccs, locations);

  assert.equal(out.length, 1);
});

test("all city categories and regions excluded when no locations remain", () => {
  const regions    = [{ id: 1, name: "US" }];
  const ccs        = [{ id: 10, regionId: 1 }];
  const locations  = [] as { regionId: number; cityCategoryId: number | null }[];

  const { cityCategories, regions: out } = filterLocationTree(regions, ccs, locations);

  assert.equal(cityCategories.length, 0);
  assert.equal(out.length, 0);
});

test("multiple populated city categories all survive", () => {
  const regions    = [{ id: 1, name: "US" }];
  const ccs        = [{ id: 1, regionId: 1 }, { id: 2, regionId: 1 }, { id: 3, regionId: 1 }];
  const locations  = [
    { regionId: 1, cityCategoryId: 1 },
    { regionId: 1, cityCategoryId: 2 },
    { regionId: 1, cityCategoryId: 3 },
  ];

  const { cityCategories } = filterLocationTree(regions, ccs, locations);

  assert.equal(cityCategories.length, 3);
});

console.log("All location-tree filter tests passed.");
