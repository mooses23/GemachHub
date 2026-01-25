import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Phone, MapPin, ChevronRight, ArrowLeft, Home, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocations, getRegions } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import type { Location, Region } from "@/lib/types";

type CityCategory = {
  id: number;
  name: string;
  slug: string;
  regionId: number;
  displayOrder: number;
  isPopular: boolean;
  description?: string;
  stateCode?: string | null;
};

const US_STATE_NAMES: Record<string, string> = {
  CA: "California",
  NY: "New York",
  NJ: "New Jersey",
  FL: "Florida",
  IL: "Illinois",
  MD: "Maryland",
  MI: "Michigan",
  OH: "Ohio",
  PA: "Pennsylvania"
};

// Canadian provinces
const CA_PROVINCE_NAMES: Record<string, string> = {
  ON: "Ontario",
  QC: "Quebec"
};

// Israeli regions
const IL_REGION_NAMES: Record<string, string> = {
  JER: "Jerusalem",
  TEL: "Tel Aviv Area",
  CEN: "Central",
  SHA: "Shomron"
};

// UK regions
const UK_REGION_NAMES: Record<string, string> = {
  LON: "London",
  MAN: "Manchester"
};

// Australian states
const AU_STATE_NAMES: Record<string, string> = {
  VIC: "Victoria",
  NSW: "New South Wales"
};

export function HierarchicalLocationSearch() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityCategory | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => getLocations(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["/api/regions"],
    queryFn: () => getRegions(),
  });

  const { data: cityCategories = [] } = useQuery<CityCategory[]>({
    queryKey: ["/api/city-categories"],
  });

  const cityCategoryMap = useMemo(() => {
    return cityCategories.reduce((acc: Record<number, CityCategory>, cat: CityCategory) => {
      acc[cat.id] = cat;
      return acc;
    }, {} as Record<number, CityCategory>);
  }, [cityCategories]);

  const regionsMap = useMemo(() => {
    return regions.reduce((acc: Record<number, Region>, region: Region) => {
      acc[region.id] = region;
      return acc;
    }, {} as Record<number, Region>);
  }, [regions]);

  const filteredLocations = useMemo(() => {
    let filtered = locations;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((location: Location) => {
        const region = regionsMap[location.regionId];
        return (
          location.name.toLowerCase().includes(query) ||
          location.address.toLowerCase().includes(query) ||
          location.locationCode.toLowerCase().includes(query) ||
          location.phone.includes(query) ||
          (location.zipCode && location.zipCode.toLowerCase().includes(query)) ||
          region?.name.toLowerCase().includes(query)
        );
      });
    }

    // Filter by selected region
    if (selectedRegion) {
      filtered = filtered.filter((location: Location) => location.regionId === selectedRegion.id);
    }

    return filtered;
  }, [locations, searchQuery, regionsMap, selectedRegion]);

  // Get unique states for US region
  const usStates = useMemo(() => {
    if (!selectedRegion || selectedRegion.slug !== "united-states") return [];
    
    const citiesInRegion = cityCategories.filter((city: CityCategory) => city.regionId === selectedRegion.id);
    const statesSet = new Set<string>();
    
    citiesInRegion.forEach((city: CityCategory) => {
      if (city.stateCode) {
        statesSet.add(city.stateCode);
      }
    });
    
    return Array.from(statesSet).sort((a, b) => {
      const nameA = US_STATE_NAMES[a] || a;
      const nameB = US_STATE_NAMES[b] || b;
      return nameA.localeCompare(nameB);
    });
  }, [selectedRegion, cityCategories]);

  // Get sub-regions for other continents (cities as the grouping)
  const subRegions = useMemo(() => {
    if (!selectedRegion) return { codes: [], names: {} as Record<string, string>, labelType: "" };
    
    const citiesInRegion = cityCategories.filter((city: CityCategory) => city.regionId === selectedRegion.id);
    
    // For non-US regions, use city names as sub-regions
    // Show glass selector for all regions except United States (which uses state selector)
    if (selectedRegion.slug !== "united-states" && citiesInRegion.length > 0) {
      return {
        codes: citiesInRegion.map(c => c.slug),
        names: citiesInRegion.reduce((acc, c) => ({ ...acc, [c.slug]: c.name }), {} as Record<string, string>),
        labelType: "Cities"
      };
    }
    
    return { codes: [], names: {} as Record<string, string>, labelType: "" };
  }, [selectedRegion, cityCategories]);

  const groupedByCity = useMemo(() => {
    if (!selectedRegion) return {};
    
    let citiesInRegion = cityCategories.filter((city: CityCategory) => city.regionId === selectedRegion.id);
    
    // Filter by selected state if in US
    if (selectedRegion.slug === "united-states" && selectedState) {
      citiesInRegion = citiesInRegion.filter((city: CityCategory) => city.stateCode === selectedState);
    }
    
    // Filter by selected sub-region for other continents
    if (selectedRegion.slug !== "united-states" && selectedSubRegion) {
      citiesInRegion = citiesInRegion.filter((city: CityCategory) => city.slug === selectedSubRegion);
    }
    
    const result: Record<string, { city: CityCategory; locations: Location[] }> = {};

    citiesInRegion.forEach((city: CityCategory) => {
      const cityLocations = filteredLocations.filter((location: Location) => 
        location.cityCategoryId === city.id
      );
      
      if (cityLocations.length > 0) {
        result[city.slug] = { city, locations: cityLocations };
      }
    });

    return result;
  }, [selectedRegion, cityCategories, filteredLocations, selectedState, selectedSubRegion]);

  if (!selectedRegion) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6 md:mb-8 px-4 md:px-0">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 md:py-6 text-base md:text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 shadow-lg w-full"
            />
          </div>
        </div>

        {searchQuery ? (
          // Show search results
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-gray-600">
                {t("showing")} <span className="font-semibold">{filteredLocations.length}</span> {t("locations")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
              {filteredLocations.map((location: Location) => (
                <LocationCard 
                  key={location.id} 
                  location={location} 
                  region={regionsMap[location.regionId]}
                />
              ))}
            </div>
          </div>
        ) : (
          // Show continent selection
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t("chooseYourContinent")}
              </h2>
              <p className="text-gray-600">
                {t("selectContinentBrowse")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
              {regions.map((region: Region) => {
                const regionLocations = locations.filter((l: Location) => l.regionId === region.id);
                const regionCities = cityCategories.filter((c: CityCategory) => c.regionId === region.id);
                
                return (
                  <Card 
                    key={region.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
                    onClick={() => setSelectedRegion(region)}
                    data-region={region.slug}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {region.name}
                        </h3>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {regionLocations.length} {t("locationsAvailable")}
                        </p>
                        {regionCities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {regionCities.slice(0, 3).map(city => (
                              <Badge key={city.id} variant="secondary" className="text-xs">
                                {city.name}
                              </Badge>
                            ))}
                            {regionCities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{regionCities.length - 3} {t("more")}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show cities within selected region
  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 px-4 md:px-0">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => { setSelectedRegion(null); setSelectedState(null); setSelectedSubRegion(null); }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToContinents")}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {t("home")}
          </Button>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {selectedRegion.name}
        </h2>
        <p className="text-gray-600">
          {t("choosePopularCity")}
        </p>
      </div>

      {/* Search within region */}
      <div className="mb-6 px-4 md:px-0">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder={`${t("searchLocationsIn")} ${selectedRegion.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-4 text-base rounded-full border-2 border-gray-200 focus:border-blue-500 shadow-lg w-full"
          />
        </div>
      </div>

      {/* State selector for United States - glass-like floating design */}
      {selectedRegion.slug === "united-states" && usStates.length > 0 && (
        <div className="mb-8 px-4 md:px-0">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedState(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
                selectedState === null
                  ? "bg-blue-500/90 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                  : "bg-white/70 text-gray-700 border-gray-200/50 hover:bg-white/90 hover:border-gray-300"
              }`}
            >
              {t("allStates")}
            </button>
            {usStates.map((stateCode) => (
              <button
                key={stateCode}
                onClick={() => setSelectedState(stateCode)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
                  selectedState === stateCode
                    ? "bg-blue-500/90 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                    : "bg-white/70 text-gray-700 border-gray-200/50 hover:bg-white/90 hover:border-gray-300"
                }`}
              >
                {US_STATE_NAMES[stateCode] || stateCode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City selector for other continents - glass-like floating design */}
      {selectedRegion.slug !== "united-states" && subRegions.codes.length > 1 && (
        <div className="mb-8 px-4 md:px-0">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedSubRegion(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
                selectedSubRegion === null
                  ? "bg-blue-500/90 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                  : "bg-white/70 text-gray-700 border-gray-200/50 hover:bg-white/90 hover:border-gray-300"
              }`}
            >
              {t("all")} {subRegions.labelType}
            </button>
            {subRegions.codes.map((code) => (
              <button
                key={code}
                onClick={() => setSelectedSubRegion(code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
                  selectedSubRegion === code
                    ? "bg-blue-500/90 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                    : "bg-white/70 text-gray-700 border-gray-200/50 hover:bg-white/90 hover:border-gray-300"
                }`}
              >
                {subRegions.names[code] || code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cities in region */}
      <div className="space-y-8">
        {Object.entries(groupedByCity).map(([citySlug, { city, locations: cityLocations }]) => (
          <div key={citySlug}>
            <div className="flex items-center justify-between mb-6 px-4 md:px-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {city.name}
                </h3>
                {city.description && (
                  <p className="text-sm text-gray-600">{city.description}</p>
                )}
              </div>
              <Badge variant="secondary">
                {cityLocations.length} {t("locations")}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
              {cityLocations.map((location: Location) => (
                <LocationCard 
                  key={location.id} 
                  location={location} 
                  region={selectedRegion}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(groupedByCity).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {t("noLocationsFound")}
          </h3>
          <p className="text-gray-500">
            {t("tryAdjustingSearch")}
          </p>
        </div>
      )}
    </div>
  );
}

const COLOR_SWATCHES: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#1F2937",
  white: "#F9FAFB",
  pink: "#EC4899",
  purple: "#8B5CF6",
  green: "#22C55E",
  orange: "#F97316",
  yellow: "#EAB308",
  gray: "#6B7280",
};

function InventoryCircle({ color, quantity }: { color: string; quantity: number }) {
  const bgColor = COLOR_SWATCHES[color] || "#9CA3AF";
  const isLight = color === "white" || color === "yellow";
  
  return (
    <div 
      className="relative w-6 h-6 rounded-full flex items-center justify-center"
      style={{ 
        backgroundColor: bgColor,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)`,
        border: isLight ? '1px solid #d1d5db' : 'none'
      }}
      title={`${color}: ${quantity}`}
    >
      <span 
        className={`text-[9px] font-bold ${isLight ? 'text-gray-700' : 'text-white'}`}
        style={{ textShadow: isLight ? 'none' : '0 1px 1px rgba(0,0,0,0.3)' }}
      >
        {quantity}
      </span>
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  region: Region;
}

function LocationCard({ location, region }: LocationCardProps) {
  const { t } = useLanguage();
  const { data: inventoryData } = useQuery<{ inventory: { color: string; quantity: number }[]; total: number }>({
    queryKey: ["/api/locations", location.id, "inventory"],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${location.id}/inventory`);
      if (!res.ok) return { inventory: [], total: 0 };
      return res.json();
    },
  });

  const inventory = inventoryData?.inventory?.filter(item => item.quantity > 0) || [];

  return (
    <Link href={`/self-deposit?locationId=${location.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge variant="default" className="mb-2 font-mono text-sm">
                {location.locationCode}
              </Badge>
              <h3 className="text-lg font-semibold text-gray-900">
                {location.name}
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-600">{location.address}</p>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-600">{location.phone}</p>
            </div>
            
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              {inventory.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {inventory.map(item => (
                    <InventoryCircle key={item.color} color={item.color} quantity={item.quantity} />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">{t("noStockInfo")}</span>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">{t("contactLabel")}</span>
                <span className="font-medium text-gray-900 ml-1">{location.contactPerson}</span>
              </div>
              <Badge variant={location.isActive ? "default" : "secondary"}>
                {location.isActive ? t("active") : t("inactive")}
              </Badge>
            </div>
            
            <div className="mt-2 text-sm">
              <span className="text-gray-500">{t("depositLabel")}</span>
              <span className="font-medium text-gray-900 ml-1">${location.depositAmount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}