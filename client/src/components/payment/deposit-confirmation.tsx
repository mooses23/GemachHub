import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Payment {
  id: number;
  transactionId: number;
  paymentMethod: string;
  paymentProvider: string | null;
  depositAmount: number;
  totalAmount: number;
  status: string;
  externalPaymentId: string | null;
  createdAt: string;
}

interface DepositConfirmationProps {
  payment: Payment;
  onConfirmed?: () => void;
}

export function DepositConfirmation({ payment, onConfirmed }: DepositConfirmationProps) {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { confirmationCode?: string; notes?: string; confirmed: boolean }) => {
      const response = await apiRequest("POST", `/api/payments/${payment.id}/confirm`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "The deposit has been successfully verified and completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onConfirmed?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      const response = await apiRequest("POST", `/api/payments/${payment.id}/reject`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Rejected",
        description: "The deposit has been marked as failed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onConfirmed?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    confirmPaymentMutation.mutate({
      confirmationCode: confirmationCode || undefined,
      notes: confirmationNotes || undefined,
      confirmed: true,
    });
  };

  const handleReject = () => {
    rejectPaymentMutation.mutate({
      notes: confirmationNotes || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "confirming":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "confirming":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(payment.status)}
          Deposit Confirmation Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Payment Method:</span>
            <span className="font-medium">{payment.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium">${(payment.depositAmount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="font-medium">${(payment.totalAmount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge className={getStatusColor(payment.status)}>
              {payment.status}
            </Badge>
          </div>
          {payment.externalPaymentId && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payment ID:</span>
              <span className="font-mono text-xs">{payment.externalPaymentId}</span>
            </div>
          )}
        </div>

        {payment.status === "confirming" && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Confirmation Required:</strong> Please verify that the payment was successfully 
                received through your {payment.paymentMethod} account before confirming this deposit.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="confirmationCode">Confirmation Code (Optional)</Label>
                <Input
                  id="confirmationCode"
                  placeholder="Enter transaction reference or confirmation code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirmationNotes">Notes (Optional)</Label>
                <Textarea
                  id="confirmationNotes"
                  placeholder="Add any verification notes or details..."
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleConfirm}
                  disabled={confirmPaymentMutation.isPending}
                  className="flex-1"
                >
                  {confirmPaymentMutation.isPending ? "Confirming..." : "Confirm Payment"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectPaymentMutation.isPending}
                  className="flex-1"
                >
                  {rejectPaymentMutation.isPending ? "Rejecting..." : "Reject Payment"}
                </Button>
              </div>
            </div>
          </>
        )}

        {payment.status === "pending" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Payment is being processed. Please wait for confirmation status.
            </p>
          </div>
        )}

        {payment.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Payment Confirmed:</strong> This deposit has been verified and completed.
            </p>
          </div>
        )}

        {payment.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Payment Failed:</strong> This deposit was not successful or was rejected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}