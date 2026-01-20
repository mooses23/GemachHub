import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Location } from "@/lib/types";
import { User, MapPin, Phone, Mail, Package } from "lucide-react";
import { InventoryByColor } from "@shared/schema";

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

function safeParseInventoryByColor(json: string | null): InventoryByColor {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to parse inventory JSON:", json, error);
    return {};
  }
}

function ColorDot({ color }: { color: string }) {
  const bgColor = COLOR_SWATCHES[color] || "#9CA3AF";
  const isLight = color === "white" || color === "yellow";
  
  return (
    <div 
      className={`w-4 h-4 rounded-full ${isLight ? 'border border-gray-300' : ''}`}
      style={{ backgroundColor: bgColor }}
      title={color}
    />
  );
}

interface LocationCardProps {
  location: Location;
  locationNumber?: number;
}

export function LocationCard({ location, locationNumber }: LocationCardProps) {
  const inventory: InventoryByColor = safeParseInventoryByColor(location.inventoryByColor);
  
  const colorEntries = Object.entries(inventory).filter(([_, qty]) => (qty || 0) > 0);
  const totalStock = location.inventoryCount || 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            {locationNumber && (
              <div className="bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full inline-block mb-2">
                #{locationNumber}
              </div>
            )}
            <h3 className="text-xl font-semibold">{location.name}</h3>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {location.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="mb-4 text-neutral-600">
          <p className="flex items-center mb-2">
            <User className="w-5 h-5 mr-2 text-neutral-500" />
            <span>{location.contactPerson}</span>
          </p>
          <p className="flex items-center mb-2">
            <MapPin className="w-5 h-5 mr-2 text-neutral-500" />
            <span>{location.address}</span>
          </p>
          <p className="flex items-center mb-2">
            <Phone className="w-5 h-5 mr-2 text-neutral-500" />
            <span>{location.phone}</span>
          </p>
          <p className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-neutral-500" />
            <span>{location.email}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-200 pt-4 flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <Package className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium">{totalStock} in stock</span>
        </div>
        {colorEntries.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full">
            {colorEntries.slice(0, 5).map(([color, qty]) => (
              <div key={color} className="flex items-center gap-1 text-xs text-neutral-600">
                <ColorDot color={color} />
                <span>{qty}</span>
              </div>
            ))}
            {colorEntries.length > 5 && (
              <span className="text-xs text-neutral-400">+{colorEntries.length - 5} more</span>
            )}
          </div>
        )}
        {colorEntries.length === 0 && totalStock > 0 && (
          <span className="text-xs text-neutral-400">Colors not specified</span>
        )}
      </CardFooter>
    </Card>
  );
}
