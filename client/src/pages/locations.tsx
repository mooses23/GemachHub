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
    <>
      {/* Meta tags */}
      <head>
        <title>Find a Baby Banz Earmuffs Gemach Near You | Gemach Locations</title>
        <meta name="description" content="Locate Baby Banz Earmuffs Gemach locations worldwide. Borrow noise-cancelling earmuffs for your baby with a $20 refundable deposit." />
        <meta property="og:title" content="Baby Banz Earmuffs Gemach Locations" />
        <meta property="og:description" content="Find the nearest Baby Banz Earmuffs Gemach location near you. Search by region or location." />
        <meta property="og:url" content="https://earmuffsgemach.com/locations" />
        <meta property="og:type" content="website" />
      </head>
      
      <div className="pt-10">
        <LocationFinder initialRegion={region} />
      </div>
    </>
  );
}
