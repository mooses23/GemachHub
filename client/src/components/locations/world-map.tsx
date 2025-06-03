import { MapPin } from "lucide-react";
import type { Location, Region } from "@/lib/types";

interface WorldMapProps {
  locations: Location[];
  regionsMap: Record<number, Region>;
}

export function WorldMap({ locations, regionsMap }: WorldMapProps) {
  // Geographic coordinates for major cities (approximate)
  const cityCoordinates: Record<string, { x: number; y: number }> = {
    "Los Angeles": { x: 118, y: 180 },
    "Miami": { x: 200, y: 220 },
    "Chicago": { x: 170, y: 160 },
    "Baltimore": { x: 205, y: 170 },
    "Detroit": { x: 178, y: 155 },
    "University Heights": { x: 185, y: 162 },
    "Philadelphia": { x: 210, y: 172 },
    "Brooklyn": { x: 215, y: 168 },
    "Monsey": { x: 212, y: 165 },
    "Lakewood": { x: 213, y: 175 },
    "Teaneck": { x: 214, y: 170 },
    "Toronto": { x: 185, y: 145 },
    "Montreal": { x: 195, y: 140 },
    "London": { x: 480, y: 140 },
    "Manchester": { x: 475, y: 135 },
    "Antwerp": { x: 490, y: 145 },
    "Melbourne": { x: 680, y: 320 },
    "Jerusalem": { x: 520, y: 200 },
    "Bnei Brak": { x: 522, y: 202 },
    "Beit Shemesh": { x: 518, y: 203 },
  };

  const getLocationCoordinates = (location: Location) => {
    // Extract city name from location name
    const cityName = location.name.split(" - ")[0];
    const baseCoords = cityCoordinates[cityName];
    
    if (!baseCoords) {
      // Default position if city not found
      return { x: 400, y: 200 };
    }

    // Add slight offset for multiple locations in same city
    const offset = location.id * 3;
    return {
      x: baseCoords.x + (offset % 10) - 5,
      y: baseCoords.y + Math.floor(offset / 10) * 3 - 3
    };
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-blue-50 to-blue-100">
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        {/* World Map Outline */}
        <defs>
          <style>{`
            .land { fill: #e5e7eb; stroke: #d1d5db; stroke-width: 0.5; }
            .water { fill: #dbeafe; }
          `}</style>
        </defs>
        
        {/* Ocean background */}
        <rect width="800" height="400" className="water" />
        
        {/* Simplified continents */}
        {/* North America */}
        <path
          d="M50 120 Q80 100 120 110 L180 100 Q220 105 250 120 L280 140 Q290 180 270 220 L240 240 Q200 250 160 245 L120 240 Q80 230 60 200 Q45 160 50 120 Z"
          className="land"
        />
        
        {/* South America */}
        <path
          d="M200 260 Q220 250 240 270 L250 300 Q255 340 245 380 Q235 390 220 385 L200 375 Q185 360 190 330 L195 300 Q195 280 200 260 Z"
          className="land"
        />
        
        {/* Europe */}
        <path
          d="M450 100 Q480 95 510 105 L530 120 Q535 140 525 160 L510 170 Q485 175 460 170 L445 155 Q440 130 450 100 Z"
          className="land"
        />
        
        {/* Africa */}
        <path
          d="M460 180 Q490 175 520 185 L535 200 Q540 240 535 280 L530 320 Q520 340 500 345 L480 340 Q460 335 450 315 L445 280 Q440 240 445 200 Q450 185 460 180 Z"
          className="land"
        />
        
        {/* Asia */}
        <path
          d="M540 100 Q580 95 620 105 L660 110 Q700 115 720 130 L740 150 Q745 180 735 210 L720 230 Q690 240 660 235 L620 230 Q580 225 550 220 L535 200 Q530 170 535 140 Q538 120 540 100 Z"
          className="land"
        />
        
        {/* Australia */}
        <path
          d="M650 300 Q680 295 710 305 L730 315 Q735 330 730 345 L715 355 Q690 360 665 355 L650 345 Q645 325 650 300 Z"
          className="land"
        />

        {/* Location pins */}
        {locations.map((location) => {
          const coords = getLocationCoordinates(location);
          const region = regionsMap[location.regionId];
          
          return (
            <g key={location.id}>
              {/* Pin shadow */}
              <circle
                cx={coords.x + 1}
                cy={coords.y + 1}
                r="4"
                fill="rgba(0,0,0,0.2)"
              />
              {/* Pin */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="4"
                fill="#dc2626"
                stroke="#fff"
                strokeWidth="1.5"
                className="hover:r-6 transition-all cursor-pointer"
              />
              <circle
                cx={coords.x}
                cy={coords.y}
                r="1.5"
                fill="#fff"
              />
              
              {/* Tooltip on hover */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={coords.x - 40}
                  y={coords.y - 35}
                  width="80"
                  height="25"
                  fill="#1f2937"
                  rx="4"
                  opacity="0.9"
                />
                <text
                  x={coords.x}
                  y={coords.y - 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                >
                  {location.locationCode}
                </text>
                <text
                  x={coords.x}
                  y={coords.y - 12}
                  textAnchor="middle"
                  fill="#d1d5db"
                  fontSize="8"
                >
                  {region?.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-gray-700">{locations.length} Gemach Locations</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Hover over pins for details
        </div>
      </div>
    </div>
  );
}