import { useState, useEffect } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripeCheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function StripeCheckoutForm({ clientSecret, amount, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/deposit/success',
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
      onError(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: `Your deposit of $${(amount / 100).toFixed(2)} has been processed.`,
      });
      onSuccess();
    } else {
      setPaymentStatus('error');
      toast({
        title: "Payment Status Unknown",
        description: "Please contact support if the issue persists.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-700">
            Your deposit of ${(amount / 100).toFixed(2)} has been processed successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Secure Card Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
          
          <Button 
            type="submit" 
            disabled={!stripe || !elements || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${(amount / 100).toFixed(2)}
              </>
            )}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>Your payment is secured by Stripe</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  publishableKey: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripeCheckout({ 
  clientSecret, 
  publishableKey, 
  amount, 
  onSuccess, 
  onError 
}: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (publishableKey && !stripePromise) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey]);

  if (!stripePromise || !clientSecret) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading payment form...</p>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066cc',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm 
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
