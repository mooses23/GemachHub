import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OPERATOR_DASHBOARD_URL = "/operator/dashboard";

interface StripeSetupCheckoutFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function StripeSetupCheckoutForm({ clientSecret, onSuccess, onError }: StripeSetupCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setSetupStatus('processing');

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.origin + OPERATOR_DASHBOARD_URL,
      },
      redirect: 'if_required',
    });

    if (error) {
      setSetupStatus('error');
      toast({
        title: "Card Setup Failed",
        description: error.message || "An error occurred during card setup",
        variant: "destructive",
      });
      onError(error.message || "Card setup failed");
      setIsProcessing(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      setSetupStatus('success');
      toast({
        title: "Card Setup Successful",
        description: "Your card has been saved securely.",
      });
      onSuccess();
    } else {
      setSetupStatus('error');
      toast({
        title: "Card Setup Status Unknown",
        description: "Please contact support if the issue persists.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (setupStatus === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">Card Saved Successfully!</h3>
          <p className="text-green-700">
            The card has been saved securely and the headband has been lent.
            The card has been saved securely.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Card...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Save Card & Lend Headband
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your card will be saved securely. You won't be charged until the operator approves the charge when you return the headband.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

interface StripeSetupCheckoutProps {
  clientSecret: string;
  publishableKey: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripeSetupCheckout({ clientSecret, publishableKey, onSuccess, onError }: StripeSetupCheckoutProps) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeSetupCheckoutForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
