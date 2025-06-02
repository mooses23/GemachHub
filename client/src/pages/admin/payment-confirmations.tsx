import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DepositConfirmation } from "@/components/payment/deposit-confirmation";

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

export default function PaymentConfirmations() {
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const pendingPayments = payments.filter(p => p.status === "confirming" || p.status === "pending");
  const recentCompleted = payments.filter(p => p.status === "completed").slice(0, 5);
  const recentFailed = payments.filter(p => p.status === "failed").slice(0, 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "confirming":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payment Confirmations</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Confirmations</h1>
        <p className="text-gray-600 mt-1">
          Review and confirm deposit payments from approved partner methods
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
            <p className="text-xs text-gray-600">Require verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentCompleted.length}
            </div>
            <p className="text-xs text-gray-600">Successfully verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${(pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingPayments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Confirmations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingPayments.map((payment) => (
              <DepositConfirmation 
                key={payment.id} 
                payment={payment}
                onConfirmed={() => {
                  // The component handles cache invalidation
                }}
              />
            ))}
          </div>
        </div>
      )}

      {pendingPayments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No payments require confirmation at this time.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Confirmed */}
        {recentCompleted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Confirmed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCompleted.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="font-medium">{payment.paymentMethod}</div>
                      <div className="text-sm text-gray-600">
                        Transaction #{payment.transactionId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(payment.totalAmount / 100).toFixed(2)}
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recently Failed */}
        {recentFailed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Failed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFailed.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="font-medium">{payment.paymentMethod}</div>
                      <div className="text-sm text-gray-600">
                        Transaction #{payment.transactionId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(payment.totalAmount / 100).toFixed(2)}
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confirmation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Before Confirming Deposits:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Verify the payment was actually received in your payment account</li>
              <li>• Check that the amount matches the deposit amount shown</li>
              <li>• For cash payments, ensure the physical money was collected</li>
              <li>• Record any transaction reference numbers for your records</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Only confirm payments after verification with your payment partner</li>
              <li>• Confirmed payments cannot be easily reversed</li>
              <li>• Failed payments will not complete the transaction</li>
              <li>• Contact admin if you need help with payment verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}