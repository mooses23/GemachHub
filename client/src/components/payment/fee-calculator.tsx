import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface FeeCalculatorProps {
  depositAmount: number;
  processingFeePercent: number;
  selectedPaymentMethod: string;
}

export function FeeCalculator({
  depositAmount,
  processingFeePercent,
  selectedPaymentMethod,
}: FeeCalculatorProps) {
  const { t } = useLanguage();
  const isCash = selectedPaymentMethod === "cash";
  const feeAmount = isCash ? 0 : Math.ceil((depositAmount * processingFeePercent) / 10000);
  const totalAmount = depositAmount + feeAmount;

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "stripe": return t("creditDebitCard");
      case "paypal": return t("paypalLabel");
      case "square": return t("squareLabel");
      case "cash": return t("cashLabel");
      default: return method;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {t("paymentSummary")}
          {!isCash && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t("feeApplied")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t("paymentMethodLabel2")}</span>
          <span className="font-medium">{getPaymentMethodName(selectedPaymentMethod)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t("depositAmountLabel")}</span>
          <span className="font-medium">${depositAmount}.00</span>
        </div>

        {!isCash && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("processingFeeLabel")} ({(processingFeePercent / 100).toFixed(1)}%):
            </span>
            <span className="font-medium text-orange-600">${feeAmount}.00</span>
          </div>
        )}

        <hr className="border-t" />

        <div className="flex justify-between items-center text-lg font-bold">
          <span>{t("totalAmountLabel")}</span>
          <span>${totalAmount}.00</span>
        </div>

        {!isCash && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>{t("processingFeeNotice")}</strong> ${feeAmount}.00 {t("processingFeeExplain")}
            </p>
          </div>
        )}

        {isCash && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>{t("noProcessingFee")}</strong> {t("noProcessingFeeDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
