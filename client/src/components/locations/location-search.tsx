import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, List, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocations, getRegions } from "@/lib/api";
import type { Location, Region } from "@shared/schema";

export function LocationSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => getLocations(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["/api/regions"],
    queryFn: () => getRegions(),
  });

  const regionsMap = useMemo(() => {
    return regions.reduce((acc: Record<number, Region>, region: Region) => {
      acc[region.id] = region;
      return acc;
    }, {} as Record<number, Region>);
  }, [regions]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    
    const query = searchQuery.toLowerCase();
    return locations.filter((location: Location) => {
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
  }, [locations, searchQuery, regionsMap]);

  const groupedLocations = useMemo(() => {
    return filteredLocations.reduce((acc: Record<string, Location[]>, location: Location) => {
      const region = regionsMap[location.regionId];
      if (!region) return acc;
      
      if (!acc[region.name]) {
        acc[region.name] = [];
      }
      acc[region.name].push(location);
      return acc;
    }, {} as Record<string, Location[]>);
  }, [filteredLocations, regionsMap]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by zip code, city, or location code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 shadow-lg"
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-full p-1">
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="rounded-full px-6"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-full px-6"
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-12">
          <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Interactive Map
              </h3>
              <p className="text-gray-500">
                Map integration coming soon - showing {filteredLocations.length} locations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-8">
        {Object.entries(groupedLocations).map(([regionName, regionLocations]) => (
          <div key={regionName}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {regionName} ({(regionLocations as Location[]).length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(regionLocations as Location[]).map((location: Location, index: number) => (
                <LocationCard 
                  key={location.id} 
                  location={location} 
                  locationNumber={index + 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No locations found
          </h3>
          <p className="text-gray-500">
            Try searching with a different zip code or city name
          </p>
        </div>
      )}
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  locationNumber: number;
}

function LocationCard({ location, locationNumber }: LocationCardProps) {
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
            <Phone className="h-4 w-4 text-gray-400 mr-2" />
            <a 
              href={`tel:${location.phone}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {location.phone}
            </a>
          </div>
          
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-400 mr-2" />
            <a 
              href={`mailto:${location.email}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {location.email}
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {location.inventoryCount} units available
            </span>
            <Button size="sm" className="rounded-full">
              Record Deposit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}