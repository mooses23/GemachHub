import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiPaypal } from "react-icons/si";

interface PaymentBreakdown {
  deposit: number;
  processingFee: number;
  total: number;
}

interface PayPalPaymentProps {
  transactionId: number;
  locationId: number;
  amount: number;
  breakdown: PaymentBreakdown;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalPayment({
  transactionId,
  locationId,
  amount,
  breakdown,
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        // Get client token from server
        const response = await fetch("/api/paypal/setup");
        if (!response.ok) {
          throw new Error("Failed to setup PayPal");
        }

        const { clientToken } = await response.json();

        // Load PayPal SDK if not already loaded
        if (!window.paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal(clientToken);
          script.onerror = () => {
            onError("Failed to load PayPal SDK");
            setIsLoading(false);
          };
          document.body.appendChild(script);
        } else {
          await initPayPal(clientToken);
        }
      } catch (error) {
        onError("Failed to initialize PayPal payment");
        setIsLoading(false);
      }
    };

    const initPayPal = async (clientToken: string) => {
      try {
        const sdkInstance = await window.paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: handleApprove,
          onCancel: handleCancel,
          onError: handleError,
        });

        const paypalButton = document.getElementById("paypal-payment-button");
        if (paypalButton) {
          paypalButton.addEventListener("click", () => handlePayPalClick(paypalCheckout));
        }

        setPaypalReady(true);
        setIsLoading(false);
      } catch (error) {
        onError("Failed to initialize PayPal");
        setIsLoading(false);
      }
    };

    loadPayPalSDK();

    return () => {
      const paypalButton = document.getElementById("paypal-payment-button");
      if (paypalButton) {
        paypalButton.removeEventListener("click", handlePayPalClick);
      }
    };
  }, [transactionId, locationId, amount, onError]);

  const createOrder = async () => {
    try {
      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          locationId,
          amount: breakdown.total / 100, // Convert cents to dollars
          currency: "USD",
          intent: "CAPTURE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create PayPal order");
      }

      const data = await response.json();
      return { orderId: data.id };
    } catch (error) {
      throw new Error("Failed to create PayPal order");
    }
  };

  const captureOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to capture PayPal order");
      }

      return await response.json();
    } catch (error) {
      throw new Error("Failed to capture PayPal payment");
    }
  };

  const handlePayPalClick = async (paypalCheckout: any) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const checkoutOptions = await createOrder();
      await paypalCheckout.start(
        { paymentFlow: "auto" },
        Promise.resolve(checkoutOptions)
      );
    } catch (error) {
      onError("Failed to start PayPal payment");
      setIsProcessing(false);
    }
  };

  const handleApprove = async (data: any) => {
    try {
      const orderData = await captureOrder(data.orderId);
      onSuccess({
        orderId: data.orderId,
        captureId: orderData.id,
        status: orderData.status,
        amount: breakdown.total,
      });
      toast({
        title: "Payment Successful",
        description: "Your PayPal payment has been processed successfully!",
      });
    } catch (error) {
      onError("Failed to complete PayPal payment");
      toast({
        title: "Payment Failed",
        description: "There was an issue completing your PayPal payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    toast({
      title: "Payment Cancelled",
      description: "Your PayPal payment was cancelled.",
    });
  };

  const handleError = (error: any) => {
    setIsProcessing(false);
    onError("PayPal payment error occurred");
    toast({
      title: "Payment Error",
      description: "There was an error with your PayPal payment.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading PayPal...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiPaypal className="h-5 w-5 text-blue-600" />
          PayPal Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment breakdown */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Deposit Amount:</span>
              <span>${(breakdown.deposit / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Processing Fee:</span>
              <span>${(breakdown.processingFee / 100).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total:</span>
              <span>${(breakdown.total / 100).toFixed(2)}</span>
            </div>
          </div>

          <Button
            id="paypal-payment-button"
            disabled={!paypalReady || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <SiPaypal className="h-4 w-4 mr-2" />
                Pay ${(breakdown.total / 100).toFixed(2)} with PayPal
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your payment is secured by PayPal. No earmuffs will be released until payment is confirmed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}