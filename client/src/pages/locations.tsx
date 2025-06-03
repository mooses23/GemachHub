import React, { useEffect, useState } from "react";
import { LocationFinder } from "@/components/locations/location-finder";
import { useLocation } from "wouter";

export default function Locations() {
  const [location] = useLocation();
  const [region, setRegion] = useState<string>("united-states");
  
  useEffect(() => {
    // Parse region from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const regionParam = params.get("region");
    
    if (regionParam) {
      setRegion(regionParam);
    }
  }, [location]);

  return (
    <div className="transition-all duration-300 ease-in-out">
      <LocationFinder initialRegion={region} />
    </div>
  );
}
