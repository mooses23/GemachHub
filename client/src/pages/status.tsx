import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface StatusPageData {
  id: number;
  status: string;
  borrowerName: string;
  amountCents: number;
  currency: string;
  locationName?: string;
  locationAddress?: string;
  requiresAction: boolean;
  paymentIntentClientSecret?: string;
  publishableKey?: string;
}

type PayLaterStatus =
  | "REQUEST_CREATED"
  | "CARD_SETUP_PENDING"
  | "CARD_SETUP_COMPLETE"
  | "APPROVED"
  | "CHARGE_ATTEMPTED"
  | "CHARGED"
  | "CHARGE_REQUIRES_ACTION"
  | "CHARGE_FAILED"
  | "DECLINED"
  | "EXPIRED";

function getStatusInfo(status: PayLaterStatus): {
  badge: string;
  icon: React.ReactNode;
  color: "default" | "secondary" | "destructive" | "outline";
  message: string;
} {
  const iconProps = { className: "w-5 h-5" };

  switch (status) {
    case "REQUEST_CREATED":
      return {
        badge: "Request Created",
        icon: <Clock {...iconProps} />,
        color: "secondary",
        message: "Your transaction request has been created. Please complete the card setup.",
      };
    case "CARD_SETUP_PENDING":
      return {
        badge: "Setup Pending",
        icon: <Clock {...iconProps} />,
        color: "secondary",
        message: "Please verify your card to complete the setup process.",
      };
    case "CARD_SETUP_COMPLETE":
      return {
        badge: "Setup Complete",
        icon: <CheckCircle {...iconProps} />,
        color: "default",
        message: "Your card has been verified and saved.",
      };
    case "APPROVED":
      return {
        badge: "Approved",
        icon: <CheckCircle {...iconProps} />,
        color: "default",
        message: "Your payment has been approved and is pending charge.",
      };
    case "CHARGE_ATTEMPTED":
      return {
        badge: "Charge Pending",
        icon: <Clock {...iconProps} />,
        color: "secondary",
        message: "The charge is being processed. Please wait...",
      };
    case "CHARGED":
      return {
        badge: "Charged",
        icon: <CheckCircle {...iconProps} />,
        color: "default",
        message: "The payment has been successfully charged.",
      };
    case "CHARGE_REQUIRES_ACTION":
      return {
        badge: "Action Required",
        icon: <AlertCircle {...iconProps} />,
        color: "destructive",
        message: "Your payment requires additional authentication. Please complete the verification below.",
      };
    case "CHARGE_FAILED":
      return {
        badge: "Charge Failed",
        icon: <XCircle {...iconProps} />,
        color: "destructive",
        message: "The charge failed. Please try again or contact support.",
      };
    case "DECLINED":
      return {
        badge: "Declined",
        icon: <XCircle {...iconProps} />,
        color: "destructive",
        message: "The payment was declined by your bank.",
      };
    case "EXPIRED":
      return {
        badge: "Expired",
        icon: <XCircle {...iconProps} />,
        color: "destructive",
        message: "This transaction link has expired.",
      };
    default:
      return {
        badge: "Unknown",
        icon: <AlertCircle {...iconProps} />,
        color: "outline",
        message: "Unable to determine transaction status.",
      };
  }
}

function StripePaymentForm({
  clientSecret,
  publishableKey,
  amountCents,
  currency,
  transactionId,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  currency: string;
  transactionId: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe is not loaded");
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        const errorMessage = error.message || "Payment confirmation failed";
        onError(errorMessage);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        onError("Please complete the 3D Secure verification");
        setIsProcessing(false);
      } else {
        onError("Payment status unknown");
        setIsProcessing(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Card Authentication
          </CardTitle>
          <CardDescription>
            Amount: {(amountCents / 100).toFixed(2)} {currency.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424242",
                    "::placeholder": {
                      color: "#9e9e9e",
                    },
                  },
                  invalid: {
                    color: "#d32f2f",
                  },
                },
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Authentication
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function StatusPageContent({
  transactionId,
  token,
}: {
  transactionId: string;
  token: string;
}) {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    null
  );

  const { data, isLoading, error, refetch } = useQuery<StatusPageData>({
    queryKey: [`/api/status/${transactionId}`, token],
    queryFn: async () => {
      const response = await fetch(
        `/api/status/${transactionId}?token=${encodeURIComponent(token)}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch transaction status");
      }

      return response.json();
    },
    enabled: !!transactionId && !!token,
  });

  // Initialize Stripe when publishableKey is available
  if (data?.publishableKey && !stripePromise) {
    setStripePromise(loadStripe(data.publishableKey));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="py-8">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load transaction status"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">No transaction data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(data.status as PayLaterStatus);
  const amount = data.amountCents / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transaction Status
          </h1>
          <p className="text-gray-600">Transaction #{data.id}</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {data.borrowerName}
                </CardTitle>
                <CardDescription>
                  {data.locationName}
                  {data.locationAddress && ` • ${data.locationAddress}`}
                </CardDescription>
              </div>
              <Badge variant={statusInfo.color} className="flex items-center gap-2">
                {statusInfo.icon}
                {statusInfo.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {amount.toFixed(2)} {data.currency.toUpperCase()}
              </p>
            </div>

            {/* Status Message */}
            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {paymentSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Payment authentication completed successfully!
                </AlertDescription>
              </Alert>
            )}

            {!paymentSuccess && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{statusInfo.message}</AlertDescription>
              </Alert>
            )}

            {/* Stripe Payment Form */}
            {data.requiresAction &&
              !paymentSuccess &&
              stripePromise &&
              data.paymentIntentClientSecret &&
              data.publishableKey && (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    clientSecret={data.paymentIntentClientSecret}
                    publishableKey={data.publishableKey}
                    amountCents={data.amountCents}
                    currency={data.currency}
                    transactionId={data.id}
                    onSuccess={() => {
                      setPaymentSuccess(true);
                      // Refetch status after successful payment
                      setTimeout(() => refetch(), 1000);
                    }}
                    onError={(error) => {
                      setPaymentError(error);
                    }}
                  />
                </Elements>
              )}

            {paymentSuccess && (
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="w-full"
              >
                Refresh Status
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline Info */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-gray-900">
                  {statusInfo.badge}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">
                  {amount.toFixed(2)} {data.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-semibold text-gray-900">
                  {data.locationName || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [, params] = useRoute("/status/:transactionId");
  const transactionId = params?.transactionId || "";
  const token = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("token") || "";

  if (!transactionId || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="py-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Invalid URL</h3>
                <p className="text-sm text-red-700">
                  Transaction ID and token are required in the URL.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <StatusPageContent transactionId={transactionId} token={token} />;
}
