import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocations } from "@/lib/api";
import type { Location } from "@shared/schema";

export function SelfDeposit() {
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => getLocations(),
  });

  const handleDepositSubmit = () => {
    if (selectedLocation) {
      const location = locations.find((loc: Location) => loc.id.toString() === selectedLocation);
      if (location) {
        alert(`Deposit recorded for ${location.name} (${location.locationCode}). Thank you!`);
      }
    }
  };

  return (
    <section id="self-deposit" className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">Self Deposit</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Select your location and record your $20 deposit for Baby Banz Earmuffs borrowing.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Record Your Deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose your gemach location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        #{location.id} - {location.name} ({location.locationCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Deposit Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Deposit amount: $20 (fully refundable)</li>
                  <li>• Return earmuffs in good condition to receive full refund</li>
                  <li>• Contact location coordinator for pickup/return arrangements</li>
                </ul>
              </div>

              <Button 
                onClick={handleDepositSubmit}
                disabled={!selectedLocation}
                className="w-full"
                size="lg"
              >
                Record Deposit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}