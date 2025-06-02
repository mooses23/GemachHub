import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface PaymentBreakdown {
  deposit: number;
  processingFee: number;
  total: number;
}

interface StripePaymentFormProps {
  transactionId: number;
  locationId: number;
  amount: number;
  breakdown: PaymentBreakdown;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
}

function StripePaymentForm({ 
  transactionId, 
  locationId, 
  amount, 
  breakdown, 
  onSuccess, 
  onError 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
            locationId,
            amount,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        onError("Failed to initialize payment. Please try again.");
      }
    };

    createPaymentIntent();
  }, [transactionId, locationId, amount, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      } else if (paymentIntent.status === "succeeded") {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
        });
        toast({
          title: "Payment Successful",
          description: "Your deposit has been processed successfully!",
        });
      }
    } catch (error) {
      onError("An unexpected error occurred");
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Card Payment
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 border rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                  },
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={!stripe || !clientSecret || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay ${(breakdown.total / 100).toFixed(2)}
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            Your payment is secured by Stripe. No earmuffs will be released until payment is confirmed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StripePaymentProps {
  transactionId: number;
  locationId: number;
  amount: number;
  breakdown: PaymentBreakdown;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
}

export default function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}