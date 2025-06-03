import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, DollarSign, Banknote, CheckCircle } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import StripePayment from "./stripe-payment";
import PayPalPayment from "./paypal-payment";
import { Location } from "@shared/schema";

interface PaymentBreakdown {
  deposit: number;
  processingFee: number;
  total: number;
}

interface PaymentProcessorProps {
  transactionId?: number;
  location?: Location;
  locationId?: number;
  depositAmount?: number;
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  paymentMethod?: string;
  onPaymentComplete?: (paymentResult: any) => void;
  onSuccess?: () => void;
}

export default function PaymentProcessor({ 
  transactionId, 
  location, 
  locationId,
  depositAmount,
  borrowerName,
  borrowerEmail,
  borrowerPhone,
  paymentMethod,
  onPaymentComplete,
  onSuccess 
}: PaymentProcessorProps) {
  const { toast } = useToast();
  const { user, isOperator, isAdmin } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("cash");
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);
  const [isProcessingCash, setIsProcessingCash] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    calculateBreakdown("cash");
  }, [location]);

  const calculateBreakdown = (paymentMethod: string) => {
    const depositAmount = location.depositAmount || 20;
    const processingFeePercent = location.processingFeePercent || 300; // 3.00%
    
    let processingFee = 0;
    if (paymentMethod !== "cash") {
      processingFee = Math.round((depositAmount * processingFeePercent) / 10000);
    }
    
    const total = depositAmount + processingFee;
    
    setBreakdown({
      deposit: depositAmount * 100, // Convert to cents
      processingFee: processingFee * 100, // Convert to cents
      total: total * 100, // Convert to cents
    });
  };

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
    calculateBreakdown(method);
  };

  const handleCashPayment = async () => {
    if (!user || (!isOperator && !isAdmin)) {
      toast({
        title: "Authentication Required",
        description: "Only operators can process cash payments.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingCash(true);
    try {
      const response = await fetch("/api/cash-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          locationId: location.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process cash payment");
      }

      const result = await response.json();
      setPaymentCompleted(true);
      onPaymentComplete({
        paymentMethod: "cash",
        amount: result.amount,
        paymentId: result.paymentId,
        status: "completed",
      });

      toast({
        title: "Cash Payment Recorded",
        description: "Cash deposit has been successfully recorded.",
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to record cash payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCash(false);
    }
  };

  const handleDigitalPaymentSuccess = (paymentResult: any) => {
    setPaymentCompleted(true);
    onPaymentComplete({
      ...paymentResult,
      paymentMethod: selectedMethod,
    });
  };

  const handleDigitalPaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  if (paymentCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Payment Confirmed</h3>
          <p className="text-gray-600 mb-4">
            Your deposit has been successfully processed. The earmuffs are now ready for pickup.
          </p>
          <Badge variant="outline" className="text-green-700 border-green-700">
            Transaction #{transactionId}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!breakdown) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Calculating payment options...</span>
        </CardContent>
      </Card>
    );
  }

  const paymentMethods = location.paymentMethods || ["cash"];
  const hasDigitalMethods = paymentMethods.some(method => 
    ["stripe", "paypal", "square"].includes(method)
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Required - {location.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Important Notice</h4>
            <p className="text-sm text-blue-800">
              No earmuffs will be released until payment is confirmed. 
              Your deposit will be fully refunded when items are returned in good condition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Location Details</h4>
              <div className="text-sm space-y-1">
                <p><strong>Code:</strong> {location.locationCode}</p>
                <p><strong>Contact:</strong> {location.contactPerson}</p>
                <p><strong>Phone:</strong> {location.phone}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Available Payment Methods</h4>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <Badge key={method} variant="outline">
                    {method === "cash" && "Cash"}
                    {method === "stripe" && "Credit Card"}
                    {method === "paypal" && "PayPal"}
                    {method === "square" && "Square"}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedMethod} onValueChange={handleMethodChange}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          {paymentMethods.includes("cash") && (
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cash
            </TabsTrigger>
          )}
          {paymentMethods.includes("stripe") && (
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credit Card
            </TabsTrigger>
          )}
          {paymentMethods.includes("paypal") && (
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <SiPaypal className="h-4 w-4" />
              PayPal
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="cash" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Cash Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span>Total Amount:</span>
                    <span>${(breakdown.deposit / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    No processing fees for cash payments
                  </p>
                </div>

                {user && (isOperator || isAdmin) ? (
                  <Button
                    onClick={handleCashPayment}
                    disabled={isProcessingCash}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessingCash ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recording Payment...
                      </>
                    ) : (
                      <>
                        <Banknote className="h-4 w-4 mr-2" />
                        Confirm Cash Payment Received
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Cash payments must be processed by the location operator. 
                      Please hand your cash payment to the location contact person.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {paymentMethods.includes("stripe") && (
          <TabsContent value="stripe" className="mt-6">
            <StripePayment
              transactionId={transactionId}
              locationId={location.id}
              amount={breakdown.total}
              breakdown={breakdown}
              onSuccess={handleDigitalPaymentSuccess}
              onError={handleDigitalPaymentError}
            />
          </TabsContent>
        )}

        {paymentMethods.includes("paypal") && (
          <TabsContent value="paypal" className="mt-6">
            <PayPalPayment
              transactionId={transactionId}
              locationId={location.id}
              amount={breakdown.total}
              breakdown={breakdown}
              onSuccess={handleDigitalPaymentSuccess}
              onError={handleDigitalPaymentError}
            />
          </TabsContent>
        )}
      </Tabs>

      {hasDigitalMethods && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Processing Fee Notice</h4>
            <p className="text-sm text-gray-600">
              A {((location.processingFeePercent || 300) / 100).toFixed(2)}% processing fee 
              is added to digital payments to cover transaction costs. 
              This fee is not retained by the gemach and goes directly to the payment processor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}