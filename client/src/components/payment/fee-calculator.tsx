import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface FeeCalculatorProps {
  depositAmount: number;
  processingFeePercent: number;
  selectedPaymentMethod: string;
}

export function FeeCalculator({ 
  depositAmount, 
  processingFeePercent, 
  selectedPaymentMethod 
}: FeeCalculatorProps) {
  const isCash = selectedPaymentMethod === "cash";
  const feeAmount = isCash ? 0 : Math.ceil((depositAmount * processingFeePercent) / 10000);
  const totalAmount = depositAmount + feeAmount;

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "stripe": return "Credit/Debit Card";
      case "paypal": return "PayPal";
      case "square": return "Square";
      case "cash": return "Cash";
      default: return method;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Payment Summary
          {!isCash && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Fee Applied
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Payment Method:</span>
          <span className="font-medium">{getPaymentMethodName(selectedPaymentMethod)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Deposit Amount:</span>
          <span className="font-medium">${depositAmount}.00</span>
        </div>
        
        {!isCash && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Processing Fee ({(processingFeePercent / 100).toFixed(1)}%):
            </span>
            <span className="font-medium text-orange-600">${feeAmount}.00</span>
          </div>
        )}
        
        <hr className="border-t" />
        
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total Amount:</span>
          <span>${totalAmount}.00</span>
        </div>
        
        {!isCash && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Processing Fee Notice:</strong> The ${feeAmount}.00 processing fee covers the cost of digital payment processing and is added to your deposit amount. This fee helps us maintain the gemach service at no cost to borrowers who pay with cash.
            </p>
          </div>
        )}
        
        {isCash && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>No Processing Fee:</strong> Cash payments have no additional fees. You pay exactly the deposit amount.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}