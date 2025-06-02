import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Location } from "@shared/schema";
import { User, MapPin, Phone, Mail } from "lucide-react";

interface LocationCardProps {
  location: Location;
  locationNumber?: number;
}

export function LocationCard({ location, locationNumber }: LocationCardProps) {
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
      <CardFooter className="border-t border-gray-200 pt-4">
        <div className="text-center">
          <span className="text-sm text-gray-500">
            Available for borrowing
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
