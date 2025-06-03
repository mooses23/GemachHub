import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, DollarSign, Banknote, CheckCircle, Calendar, Lock } from "lucide-react";
import { SiPaypal, SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PaymentData {
  locationId: number;
  depositAmount: number;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  paymentMethod: string;
}

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
  
  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState(borrowerName);
  
  // PayPal State
  const [paypalEmail, setPaypalEmail] = useState(borrowerEmail);
  
  // Cash State
  const [cashReceived, setCashReceived] = useState(false);
  
  const processingFeePercent = 300; // 3%
  const processingFee = paymentMethod === "cash" ? 0 : Math.ceil((depositAmount * processingFeePercent) / 10000);
  const totalAmount = depositAmount + processingFee;

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return res.json();
    },
    onSuccess: (transaction) => {
      // Create payment after transaction
      createPaymentMutation.mutate({
        transactionId: transaction.id,
        paymentMethod,
        paymentProvider: getPaymentProvider(),
        depositAmount,
        totalAmount,
        status: paymentMethod === "cash" ? "confirming" : "pending"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    }
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      if (paymentMethod === "cash") {
        const res = await apiRequest("POST", "/api/cash-payment", paymentData);
        return res.json();
      } else if (paymentMethod === "stripe") {
        const res = await apiRequest("POST", "/api/stripe-payment", {
          ...paymentData,
          cardDetails: {
            number: cardNumber.replace(/\s/g, ''),
            expiry: expiryDate,
            cvv,
            name: cardholderName
          }
        });
        return res.json();
      } else if (paymentMethod === "paypal") {
        const res = await apiRequest("POST", "/api/paypal-payment", {
          ...paymentData,
          paypalEmail
        });
        return res.json();
      }
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      
      toast({
        title: "Payment Processed",
        description: getSuccessMessage(),
        variant: "default",
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  });

  const getPaymentProvider = () => {
    switch (paymentMethod) {
      case "stripe": return "Stripe";
      case "paypal": return "PayPal";
      case "cash": return null;
      default: return null;
    }
  };

  const getSuccessMessage = () => {
    switch (paymentMethod) {
      case "cash":
        return `Cash deposit of $${totalAmount} recorded. Awaiting operator confirmation.`;
      case "stripe":
        return `Credit card payment of $${totalAmount} processed successfully.`;
      case "paypal":
        return `PayPal payment of $${totalAmount} processed successfully.`;
      default:
        return `Payment of $${totalAmount} processed successfully.`;
    }
  };

  const handleSubmitPayment = () => {
    // Validate based on payment method
    if (paymentMethod === "stripe") {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        toast({
          title: "Validation Error",
          description: "Please fill in all credit card details",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "paypal") {
      if (!paypalEmail) {
        toast({
          title: "Validation Error", 
          description: "Please enter your PayPal email",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "cash") {
      if (!cashReceived) {
        toast({
          title: "Validation Error",
          description: "Please confirm cash has been received",
          variant: "destructive",
        });
        return;
      }
    }

    // Create transaction first
    createTransactionMutation.mutate({
      locationId,
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      depositAmount,
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: `Self-deposit via ${paymentMethod}`
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardIcon = () => {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '4') return <SiVisa className="w-6 h-6 text-blue-600" />;
    if (firstDigit === '5') return <SiMastercard className="w-6 h-6 text-red-600" />;
    if (firstDigit === '3') return <SiAmericanexpress className="w-6 h-6 text-green-600" />;
    return <CreditCard className="w-6 h-6 text-gray-400" />;
  };

  const isProcessing = createTransactionMutation.isPending || createPaymentMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
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

      {/* Payment Method Forms */}
      {paymentMethod === "stripe" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Credit Card Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="pr-12"
                />
                <div className="absolute right-3 top-3">
                  {getCardIcon()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p>Your payment information is encrypted and secure. We never store your card details.</p>
            </div>
          </CardContent>
        </Card>
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
            <div>
              <Label htmlFor="paypalEmail">PayPal Email Address</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <SiPaypal className="w-4 h-4" />
                <span className="font-medium">PayPal Checkout</span>
              </div>
              <p>You'll be redirected to PayPal to complete your payment securely.</p>
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
                <li>• Amount due: ${totalAmount.toFixed(2)} (no processing fees for cash)</li>
                <li>• Hand cash directly to the location coordinator</li>
                <li>• Get a receipt for your records</li>
                <li>• Payment will be confirmed by the operator</li>
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
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmitPayment}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {paymentMethod === "cash" && <Banknote className="w-4 h-4 mr-2" />}
            {paymentMethod === "stripe" && <CreditCard className="w-4 h-4 mr-2" />}
            {paymentMethod === "paypal" && <SiPaypal className="w-4 h-4 mr-2" />}
            {paymentMethod === "cash" ? `Record Cash Payment $${totalAmount.toFixed(2)}` : 
             paymentMethod === "paypal" ? `Pay $${totalAmount.toFixed(2)} with PayPal` :
             `Pay $${totalAmount.toFixed(2)} with Card`}
          </>
        )}
      </Button>
    </div>
  );
}