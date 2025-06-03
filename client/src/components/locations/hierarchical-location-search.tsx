import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Mail, MapPin, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocations, getRegions } from "@/lib/api";
import type { Location, Region } from "@/lib/types";

type CityCategory = {
  id: number;
  name: string;
  slug: string;
  regionId: number;
  displayOrder: number;
  isPopular: boolean;
  description?: string;
};

export function HierarchicalLocationSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityCategory | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => getLocations(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["/api/regions"],
    queryFn: () => getRegions(),
  });

  // Generate city categories from actual location data
  const popularCities: CityCategory[] = useMemo(() => {
    const cityGroups = new Map<string, { regionId: number; locations: Location[]; displayOrder: number }>();
    
    // Group locations by extracted city names
    locations.forEach(location => {
      // Extract city name from location name or address
      let cityName = "";
      
      // Try to extract city from location name (e.g., "Los Angeles - Pico" -> "Los Angeles")
      const nameMatch = location.name.match(/^([^-]+)/);
      if (nameMatch) {
        cityName = nameMatch[1].trim();
      } else {
        // Fallback to extracting from address
        const addressParts = location.address.split(',');
        if (addressParts.length >= 2) {
          cityName = addressParts[1].trim();
        } else {
          cityName = location.name;
        }
      }

      const key = `${cityName}-${location.regionId}`;
      if (!cityGroups.has(key)) {
        cityGroups.set(key, {
          regionId: location.regionId,
          locations: [],
          displayOrder: 0
        });
      }
      cityGroups.get(key)!.locations.push(location);
    });

    // Convert to city categories, prioritizing cities with more locations
    const cities: CityCategory[] = [];
    let cityId = 1;

    Array.from(cityGroups.entries())
      .sort(([, a], [, b]) => b.locations.length - a.locations.length) // Sort by location count
      .forEach(([key, group], index) => {
        const cityName = key.split('-')[0];
        const slug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        cities.push({
          id: cityId++,
          name: cityName,
          slug,
          regionId: group.regionId,
          displayOrder: index + 1,
          isPopular: group.locations.length >= 2, // Mark as popular if 2+ locations
          description: `${group.locations.length} location${group.locations.length > 1 ? 's' : ''} available`
        });
      });

    return cities;
  }, [locations, regions]);

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
      filtered = filtered.filter(location => location.regionId === selectedRegion.id);
    }

    return filtered;
  }, [locations, searchQuery, regionsMap, selectedRegion]);

  const groupedByCity = useMemo(() => {
    if (!selectedRegion) return {};
    
    const citiesInRegion = popularCities.filter(city => city.regionId === selectedRegion.id);
    const result: Record<string, { city: CityCategory; locations: Location[] }> = {};

    citiesInRegion.forEach(city => {
      // Match locations by extracting city name from location name
      const cityLocations = filteredLocations.filter((location: Location) => {
        const nameMatch = location.name.match(/^([^-]+)/);
        const locationCity = nameMatch ? nameMatch[1].trim() : location.name;
        return locationCity.toLowerCase() === city.name.toLowerCase();
      });
      
      if (cityLocations.length > 0) {
        result[city.slug] = { city, locations: cityLocations };
      }
    });

    return result;
  }, [selectedRegion, popularCities, filteredLocations]);

  if (!selectedRegion) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6 md:mb-8 px-4 md:px-0">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search all locations or select a continent below..."
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
                Showing <span className="font-semibold">{filteredLocations.length}</span> locations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
              {filteredLocations.map((location: Location, index: number) => (
                <LocationCard 
                  key={location.id} 
                  location={location} 
                  locationNumber={index + 1}
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
                Choose Your Continent
              </h2>
              <p className="text-gray-600">
                Select a continent to browse popular cities and locations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
              {regions.map((region: Region) => {
                const regionLocations = locations.filter(l => l.regionId === region.id);
                const regionCities = popularCities.filter(c => c.regionId === region.id);
                
                return (
                  <Card 
                    key={region.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
                    onClick={() => setSelectedRegion(region)}
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
                          {regionLocations.length} locations available
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
                                +{regionCities.length - 3} more
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
        <Button 
          variant="ghost" 
          onClick={() => setSelectedRegion(null)}
          className="mb-4"
        >
          ← Back to Continents
        </Button>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {selectedRegion.name}
        </h2>
        <p className="text-gray-600">
          Choose a popular city or browse all locations
        </p>
      </div>

      {/* Search within region */}
      <div className="mb-6 px-4 md:px-0">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder={`Search locations in ${selectedRegion.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-4 text-base rounded-full border-2 border-gray-200 focus:border-blue-500 shadow-lg w-full"
          />
        </div>
      </div>

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
                {cityLocations.length} locations
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
              {cityLocations.map((location: Location, index: number) => (
                <LocationCard 
                  key={location.id} 
                  location={location} 
                  locationNumber={index + 1}
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
            No locations found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or browse other cities
          </p>
        </div>
      )}
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  locationNumber: number;
  region: Region;
}

function LocationCard({ location, locationNumber, region }: LocationCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              #{locationNumber}
            </Badge>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {location.name}
            </h3>
            <p className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
              {location.locationCode}
            </p>
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
            <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate">{location.email}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">Contact:</span>
              <span className="font-medium text-gray-900 ml-1">{location.contactPerson}</span>
            </div>
            <Badge variant={location.isActive ? "default" : "secondary"}>
              {location.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Deposit:</span>
            <span className="font-medium text-gray-900 ml-1">${location.depositAmount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}