import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Banknote, CheckCircle } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
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
  const { t } = useLanguage();
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
          title: t("depositRecordedTitle"),
          description: t("cashDepositRecorded").replace("{amount}", `$${totalAmount.toFixed(2)}`),
        });
        setPaymentComplete(true);
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToInitiateDeposit"),
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
      title: t("paymentError"),
      description: error,
      variant: "destructive",
    });
  };

  const handleCashPayment = () => {
    if (!cashReceived) {
      toast({
        title: t("confirmationRequired"),
        description: t("pleaseConfirmCashGiven"),
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
            {paymentMethod === 'cash' ? t("depositRecordedExclaim") : t("paymentSuccessful")}
          </h3>
          <p className="text-green-700">
            {paymentMethod === 'cash'
              ? t("cashDepositAwaitingConfirmation")
              : t("yourDepositProcessed").replace("{amount}", `$${totalAmount.toFixed(2)}`)
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
            {t("paymentSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t("depositAmountLabel")}</span>
            <span className="font-semibold">${depositAmount.toFixed(2)}</span>
          </div>
          {processingFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("processingFeeLabel")} ({(processingFeePercent / 100).toFixed(1)}%):</span>
              <span>${processingFee.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>{t("totalAmountLabel")}</span>
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
              {t("preparingCheckout")}
            </>
          ) : (
            <>{t("proceedToCardPayment")}</>
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
              {t("paypalPayment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t("paypalComingSoon")}
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
              {t("cashPayment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">{t("cashPaymentInstructions")}</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>{t("amountDueNoFees").replace("{amount}", `$${totalAmount.toFixed(2)}`)}</li>
                <li>{t("handCashDirectly")}</li>
                <li>{t("getReceipt")}</li>
                <li>{t("paymentConfirmedByOperator")}</li>
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
                {t("iConfirmGivenCash").replace("{amount}", `$${totalAmount.toFixed(2)}`)}
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
                  {t("recording")}
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 mr-2" />
                  {t("recordCashPayment")} ${totalAmount.toFixed(2)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
