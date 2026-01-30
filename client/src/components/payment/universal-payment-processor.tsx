import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Banknote, CheckCircle } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StripeCheckout from "./stripe-checkout";

interface UniversalPaymentProcessorProps {
  locationId: number;
  depositAmount: number;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  paymentMethod: string;
  onSuccess: () => void;
}

export default function UniversalPaymentProcessor({
  locationId,
  depositAmount,
  borrowerName,
  borrowerEmail,
  borrowerPhone,
  paymentMethod,
  onSuccess
}: UniversalPaymentProcessorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cashReceived, setCashReceived] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    clientSecret: string;
    publishableKey: string;
    totalAmount: number;
  } | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const isInitiatingRef = useRef(false);
  
  const processingFeePercent = 300;
  const processingFee = paymentMethod === "cash" ? 0 : Math.ceil((depositAmount * processingFeePercent) / 10000);
  const totalAmount = depositAmount + processingFee;

  const initiateDepositMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/deposits/initiate", {
        locationId,
        borrowerName,
        borrowerEmail,
        borrowerPhone,
        paymentMethod
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (paymentMethod === 'stripe' && data.clientSecret && data.publishableKey) {
        setStripePaymentData({
          clientSecret: data.clientSecret,
          publishableKey: data.publishableKey,
          totalAmount: totalAmount * 100
        });
      } else if (paymentMethod === 'cash') {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        toast({
          title: "Deposit Recorded",
          description: `Cash deposit of $${totalAmount.toFixed(2)} recorded. Awaiting operator confirmation.`,
        });
        setPaymentComplete(true);
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate deposit",
        variant: "destructive",
      });
    }
  });

  const handleStripeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    setPaymentComplete(true);
    onSuccess();
  };

  const handleStripeError = (error: string) => {
    toast({
      title: "Payment Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleCashPayment = () => {
    if (!cashReceived) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you have given cash to the location coordinator",
        variant: "destructive",
      });
      return;
    }
    initiateDepositMutation.mutate();
  };

  const handleStripeInitiate = () => {
    // Prevent double-clicks
    if (isInitiatingRef.current || initiateDepositMutation.isPending) {
      return;
    }
    isInitiatingRef.current = true;
    initiateDepositMutation.mutate(undefined, {
      onSettled: () => {
        isInitiatingRef.current = false;
      }
    });
  };

  if (paymentComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">
            {paymentMethod === 'cash' ? 'Deposit Recorded!' : 'Payment Successful!'}
          </h3>
          <p className="text-green-700">
            {paymentMethod === 'cash' 
              ? 'Your cash deposit has been recorded and is awaiting confirmation.'
              : `Your deposit of $${totalAmount.toFixed(2)} has been processed.`
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Deposit Amount:</span>
            <span className="font-semibold">${depositAmount.toFixed(2)}</span>
          </div>
          {processingFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Processing Fee ({(processingFeePercent / 100).toFixed(1)}%):</span>
              <span>${processingFee.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {paymentMethod === "stripe" && !stripePaymentData && (
        <Button 
          onClick={handleStripeInitiate}
          disabled={initiateDepositMutation.isPending}
          className="w-full"
          size="lg"
        >
          {initiateDepositMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparing Checkout...
            </>
          ) : (
            <>Proceed to Card Payment</>
          )}
        </Button>
      )}

      {paymentMethod === "stripe" && stripePaymentData && (
        <StripeCheckout
          clientSecret={stripePaymentData.clientSecret}
          publishableKey={stripePaymentData.publishableKey}
          amount={stripePaymentData.totalAmount}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
        />
      )}

      {paymentMethod === "paypal" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SiPaypal className="w-5 h-5 text-blue-600" />
              PayPal Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                PayPal integration coming soon. Please use credit card or cash for now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "cash" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Cash Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Cash Payment Instructions</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>Amount due: ${totalAmount.toFixed(2)} (no processing fees for cash)</li>
                <li>Hand cash directly to the location coordinator</li>
                <li>Get a receipt for your records</li>
                <li>Payment will be confirmed by the operator</li>
              </ul>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cashReceived"
                checked={cashReceived}
                onChange={(e) => setCashReceived(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="cashReceived" className="text-sm">
                I confirm that I have given ${totalAmount.toFixed(2)} cash to the location coordinator
              </Label>
            </div>

            <Button 
              onClick={handleCashPayment}
              disabled={!cashReceived || initiateDepositMutation.isPending}
              className="w-full"
              size="lg"
            >
              {initiateDepositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 mr-2" />
                  Record Cash Payment ${totalAmount.toFixed(2)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
