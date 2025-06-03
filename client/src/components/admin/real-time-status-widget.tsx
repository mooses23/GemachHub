import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RealtimeStatusData {
  recentPayments: Array<{
    id: number;
    amount: number;
    status: string;
    method: string;
    timestamp: string;
    borrowerName: string;
  }>;
  pendingCount: number;
  successRate: number;
  lastUpdateTime: string;
}

export function RealtimeStatusWidget() {
  const [notifications, setNotifications] = useState<string[]>([]);

  const { data: statusData, isLoading } = useQuery<RealtimeStatusData>({
    queryKey: ["/api/realtime-status"],
    queryFn: () => apiRequest("GET", "/api/realtime-status").then(res => res.json()),
    refetchInterval: 5000, // Update every 5 seconds
  });

  useEffect(() => {
    if (statusData?.recentPayments) {
      // Check for new notifications
      const recentFailures = statusData.recentPayments.filter(p => 
        p.status === 'failed' && 
        new Date(p.timestamp).getTime() > Date.now() - 60000 // Last minute
      );

      if (recentFailures.length > 0) {
        setNotifications(prev => [
          ...prev.slice(-4), // Keep last 4 notifications
          `${recentFailures.length} payment(s) failed in the last minute`
        ]);
      }
    }
  }, [statusData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'confirming': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Real-time Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Real-time Status
          </div>
          <Badge variant={statusData?.successRate && statusData.successRate > 90 ? "default" : "destructive"}>
            {statusData?.successRate?.toFixed(1) || 0}% Success
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{statusData?.pendingCount || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-lg font-semibold">Live</span>
            </div>
            <div className="text-xs text-gray-500">Monitoring Active</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Recent Activity</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {statusData?.recentPayments?.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(payment.status)}
                  <div>
                    <div className="text-sm font-medium">${payment.amount}</div>
                    <div className="text-xs text-gray-600">{payment.borrowerName}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(payment.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Bell className="w-4 h-4" />
              Alerts
            </h3>
            <div className="space-y-1">
              {notifications.slice(-3).map((notification, index) => (
                <div key={index} className="text-xs p-2 bg-red-50 text-red-800 rounded">
                  {notification}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-2">
          Last updated: {statusData?.lastUpdateTime ? 
            new Date(statusData.lastUpdateTime).toLocaleTimeString() : 
            'Never'
          }
        </div>
      </CardContent>
    </Card>
  );
}