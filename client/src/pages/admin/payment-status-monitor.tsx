import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentDetectionAnalytics {
  totalPayments: number;
  statusBreakdown: Record<string, number>;
  methodPerformance: Array<{
    method: string;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
  pendingPayments: number;
  retryableFailures: number;
}

export default function PaymentStatusMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch detection analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<PaymentDetectionAnalytics>({
    queryKey: ["/api/analytics/deposit-detection", dateRange],
    queryFn: () => 
      apiRequest("GET", `/api/analytics/deposit-detection?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual status check mutation
  const statusCheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/payments/status-check");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/deposit-detection"] });
      toast({
        title: "Status Check Complete",
        description: "Payment statuses have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Check Failed",
        description: error.message || "Failed to check payment statuses",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'confirming': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_retry': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe': return '💳';
      case 'paypal': return '🅿️';
      case 'cash': return '💵';
      default: return '💰';
    }
  };

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payment Status Monitor</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payment Status Monitor</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of deposit acceptance and decline detection
          </p>
        </div>
        
        <Button 
          onClick={() => statusCheckMutation.mutate()}
          disabled={statusCheckMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${statusCheckMutation.isPending ? 'animate-spin' : ''}`} />
          Check Status
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              All payment attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retryable Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.retryableFailures || 0}</div>
            <p className="text-xs text-muted-foreground">
              Can be retried
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics && analytics.totalPayments > 0 
                ? Math.round(((analytics.statusBreakdown.completed || 0) / analytics.totalPayments) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall acceptance rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Payment Status</TabsTrigger>
          <TabsTrigger value="methods">Method Performance</TabsTrigger>
          <TabsTrigger value="detection">Detection Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {analytics?.statusBreakdown && Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status)}`}>
                      {status === 'completed' && <CheckCircle className="w-4 h-4 mr-1" />}
                      {status === 'failed' && <XCircle className="w-4 h-4 mr-1" />}
                      {(status === 'confirming' || status === 'pending') && <Clock className="w-4 h-4 mr-1" />}
                      {status === 'pending_retry' && <RefreshCw className="w-4 h-4 mr-1" />}
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </div>
                    <div className="text-2xl font-bold mt-2">{count}</div>
                    <div className="text-sm text-gray-500">
                      {analytics.totalPayments > 0 ? Math.round((count / analytics.totalPayments) * 100) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.methodPerformance?.map((method) => (
                  <div key={method.method} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMethodIcon(method.method)}</span>
                        <h3 className="font-semibold capitalize">{method.method}</h3>
                      </div>
                      <Badge variant={method.successRate >= 95 ? "default" : method.successRate >= 80 ? "secondary" : "destructive"}>
                        {method.successRate.toFixed(1)}% Success
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Attempts</div>
                        <div className="font-semibold">{method.total}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Successful</div>
                        <div className="font-semibold text-green-600">{method.successful}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Failed</div>
                        <div className="font-semibold text-red-600">{method.failed}</div>
                      </div>
                    </div>
                    
                    {/* Success Rate Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${method.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Real-time Detection Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Webhook Processing</h3>
                  <p className="text-sm text-blue-800">
                    Real-time status updates from Stripe and PayPal webhooks ensure immediate 
                    deposit confirmation or decline detection.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Automatic Retries</h3>
                  <p className="text-sm text-green-800">
                    Failed payments with retryable errors are automatically scheduled for 
                    reprocessing with exponential backoff.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">Status Monitoring</h3>
                  <p className="text-sm text-orange-800">
                    Pending payments are monitored every 10 minutes to detect status changes 
                    and ensure no deposits are missed.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Audit Trail</h3>
                  <p className="text-sm text-purple-800">
                    All status changes are logged with timestamps, user information, and 
                    detailed metadata for compliance tracking.
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Detection Flow</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 rounded">Payment Initiated</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-yellow-100 rounded">Webhook Received</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-green-100 rounded">Status Updated</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-purple-100 rounded">System Synced</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}