/**
 * filterLocationTree — strips city categories and regions that have no
 * locations from the combined /api/location-tree payload.
 *
 * City categories with zero locations are removed entirely.
 * Regions are removed only when they have no direct locations AND no
 * city categories that still have locations.
 *
 * This is the single source of truth used by the /api/location-tree
 * handler and its tests.
 */

type HasId        = { id: number };
type HasRegionId  = { regionId: number };
type HasCcId      = { cityCategoryId: number | null };

export function filterLocationTree<
  R extends HasId,
  C extends HasId & HasRegionId,
  L extends HasRegionId & HasCcId,
>(
  regions: R[],
  cityCategories: C[],
  locations: L[],
): { regions: R[]; cityCategories: C[] } {
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
