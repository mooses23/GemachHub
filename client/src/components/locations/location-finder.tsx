import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getRegions } from "@/lib/api";
import { Region, Location } from "@shared/schema";
import { LocationCard } from "./location-card";
import { RegionTabs } from "./region-tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface LocationFinderProps {
  initialRegion?: string;
}

export function LocationFinder({ initialRegion = "united-states" }: LocationFinderProps) {
  const [activeRegion, setActiveRegion] = useState(initialRegion);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // When initialRegion prop changes, update the active region
  useEffect(() => {
    if (initialRegion) {
      setActiveRegion(initialRegion);
    }
  }, [initialRegion]);

  // Filter locations by active region and search term
  const filteredLocations = locations.filter(location => {
    const matchesRegion = regions.find(r => r.slug === activeRegion)?.id === location.regionId;
    
    if (!matchesRegion) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      location.address.toLowerCase().includes(searchLower) ||
      location.contactPerson.toLowerCase().includes(searchLower)
    );
  });

  return (
    <section id="find-gemach" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">{t("locations.title")}</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            {t("locations.description")}
          </p>
        </div>
        
        {/* Region Tabs */}
        <RegionTabs 
          regions={regions} 
          activeRegion={activeRegion} 
          setActiveRegion={setActiveRegion} 
        />
        
        {/* Search Box */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder={t("locations.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <Search className="absolute right-3 top-3 text-neutral-500 h-5 w-5" />
          </div>
        </div>
        
        {/* Locations Grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-8 text-center">
                <p className="text-lg text-neutral-600">
                  {searchTerm 
                    ? "No locations found matching your search. Please try a different search term." 
                    : "No locations found in this region yet."}
                </p>
              </div>
            )}
          </div>
          
          {filteredLocations.length > 9 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-8 text-center">
              <button className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-primary hover:text-primary-dark">
                View more locations
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
