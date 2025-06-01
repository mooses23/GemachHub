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

  const handleRegionClick = (regionSlug: string) => {
    setActiveRegion(regionSlug);
    
    // Smooth scroll to top of results
    setTimeout(() => {
      const resultsSection = document.getElementById('locations-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {sortedRegions.map((region) => (
          <Button
            key={region.slug}
            variant={activeRegion === region.slug ? "default" : "secondary"}
            onClick={() => handleRegionClick(region.slug)}
            className={`transition-all ${activeRegion === region.slug 
              ? "bg-blue-600 text-white shadow-lg" 
              : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
            }`}
          >
            {region.name}
          </Button>
        ))}
      </div>
      
      {/* Quick stats */}
      <div className="text-center text-sm text-gray-500">
        Click region names above to filter locations
      </div>
    </div>
  );
}
