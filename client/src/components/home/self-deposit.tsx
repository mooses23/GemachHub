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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocations } from "@/lib/api";
import type { Location } from "@shared/schema";
import PaymentProcessor from "@/components/payment/payment-processor";
import { FeeCalculator } from "@/components/payment/fee-calculator";
import { CreditCard, DollarSign, MapPin } from "lucide-react";

export function SelfDeposit() {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => getLocations(),
  });

  const selectedLocationData = locations.find((loc: Location) => loc.id.toString() === selectedLocation);

  const canProceedToPayment = selectedLocation && borrowerName && borrowerEmail && selectedPaymentMethod;

  const handleProceedToPayment = () => {
    if (canProceedToPayment) {
      setShowPayment(true);
    }
  };

  if (showPayment && selectedLocationData) {
    return (
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-800 mb-4">Complete Your Deposit</h2>
              <p className="text-lg text-neutral-600">
                {borrowerName}, complete your ${selectedLocationData.depositAmount} deposit for {selectedLocationData.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Borrow Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p className="font-semibold">{selectedLocationData.name}</p>
                    <p className="text-sm text-gray-500">{selectedLocationData.locationCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Borrower</Label>
                    <p className="font-semibold">{borrowerName}</p>
                    <p className="text-sm text-gray-500">{borrowerEmail}</p>
                    {borrowerPhone && <p className="text-sm text-gray-500">{borrowerPhone}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                    <p className="font-semibold capitalize">{selectedPaymentMethod}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPaymentMethod && (
                    <div className="space-y-4">
                      <FeeCalculator 
                        depositAmount={selectedLocationData.depositAmount}
                        processingFeePercent={selectedLocationData.processingFeePercent || 300}
                        selectedPaymentMethod={selectedPaymentMethod}
                      />
                      
                      <PaymentProcessor
                        locationId={selectedLocationData.id}
                        depositAmount={selectedLocationData.depositAmount}
                        borrowerName={borrowerName}
                        borrowerEmail={borrowerEmail}
                        borrowerPhone={borrowerPhone}
                        paymentMethod={selectedPaymentMethod}
                        onSuccess={() => {
                          setShowPayment(false);
                          setSelectedLocation("");
                          setBorrowerName("");
                          setBorrowerEmail("");
                          setBorrowerPhone("");
                          setSelectedPaymentMethod("");
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowPayment(false)}
                className="mr-4"
              >
                Back to Details
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="borrowerName">Full Name *</Label>
                    <Input
                      id="borrowerName"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="borrowerEmail">Email Address *</Label>
                    <Input
                      id="borrowerEmail"
                      type="email"
                      value={borrowerEmail}
                      onChange={(e) => setBorrowerEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="borrowerPhone">Phone Number (Optional)</Label>
                  <Input
                    id="borrowerPhone"
                    type="tel"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label>Payment Method *</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose payment method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit/Debit Card
                        </div>
                      </SelectItem>
                      <SelectItem value="paypal">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          PayPal
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cash (No Processing Fee)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedLocationData && selectedPaymentMethod && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <FeeCalculator 
                      depositAmount={selectedLocationData.depositAmount}
                      processingFeePercent={selectedLocationData.processingFeePercent || 300}
                      selectedPaymentMethod={selectedPaymentMethod}
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleProceedToPayment}
                disabled={!canProceedToPayment}
                className="w-full"
                size="lg"
              >
                {selectedPaymentMethod === 'cash' ? 'Record Cash Deposit' : 'Proceed to Payment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}