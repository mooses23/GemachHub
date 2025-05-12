import React from "react";
import { Region } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface RegionTabsProps {
  regions: Region[];
  activeRegion: string;
  setActiveRegion: (region: string) => void;
}

export function RegionTabs({ regions, activeRegion, setActiveRegion }: RegionTabsProps) {
  // Default tabs if no regions are available yet
  const defaultRegions = [
    { id: 1, name: "United States", slug: "united-states", displayOrder: 1 },
    { id: 2, name: "Canada", slug: "canada", displayOrder: 2 },
    { id: 3, name: "Australia", slug: "australia", displayOrder: 3 },
    { id: 4, name: "Europe", slug: "europe", displayOrder: 4 },
    { id: 5, name: "Israel", slug: "israel", displayOrder: 5 },
  ];

  const tabsToShow = regions.length > 0 ? regions : defaultRegions;
  
  // Sort by displayOrder
  const sortedRegions = [...tabsToShow].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2">
      {sortedRegions.map((region) => (
        <Button
          key={region.slug}
          variant={activeRegion === region.slug ? "default" : "secondary"}
          onClick={() => setActiveRegion(region.slug)}
          className={activeRegion === region.slug ? "" : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"}
        >
          {region.name}
        </Button>
      ))}
    </div>
  );
}
