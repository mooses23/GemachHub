import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Save, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPaymentMethodSchema } from "@shared/schema";

const formSchema = insertPaymentMethodSchema.extend({
  processingFeePercent: z.number().min(0).max(1000),
  fixedFee: z.number().min(0),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookSecret: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface PaymentMethod {
  id: number;
  name: string;
  displayName: string;
  provider: string | null;
  isActive: boolean;
  isAvailableToLocations: boolean;
  processingFeePercent: number;
  fixedFee: number;
  requiresApi: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  webhookSecret: string | null;
  isConfigured: boolean;
  createdAt: string;
}

export default function PaymentMethodsAdmin() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      provider: "",
      isActive: true,
      isAvailableToLocations: false,
      processingFeePercent: 0,
      fixedFee: 0,
      requiresApi: false,
      apiKey: "",
      apiSecret: "",
      webhookSecret: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/payment-methods", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setIsCreating(false);
      form.reset();
      toast({ title: "Payment method created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const response = await apiRequest("PATCH", `/api/payment-methods/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setEditingId(null);
      toast({ title: "Payment method updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Payment method deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const configureMutation = useMutation({
    mutationFn: async ({ id, credentials }: { id: number; credentials: { apiKey: string; apiSecret: string; webhookSecret?: string; } }) => {
      const response = await apiRequest("POST", `/api/payment-methods/${id}/configure`, credentials);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ 
        title: "Payment method configured successfully",
        description: `${data.method?.displayName} is now active and available across all locations`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to configure payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    form.reset({
      name: method.name,
      displayName: method.displayName,
      provider: method.provider,
      isActive: method.isActive,
      isAvailableToLocations: method.isAvailableToLocations,
      processingFeePercent: method.processingFeePercent,
      fixedFee: method.fixedFee,
      requiresApi: method.requiresApi,
      apiKey: method.apiKey || "",
      apiSecret: method.apiSecret || "",
      webhookSecret: method.webhookSecret || "",
    });
  };

  const handleUpdate = (data: FormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    }
  };

  const toggleAvailability = async (method: PaymentMethod) => {
    updateMutation.mutate({
      id: method.id,
      data: { isAvailableToLocations: !method.isAvailableToLocations }
    });
  };

  const formatFee = (percent: number, fixed: number) => {
    if (percent === 0 && fixed === 0) return "No fees";
    const parts = [];
    if (percent > 0) parts.push(`${(percent / 100).toFixed(2)}%`);
    if (fixed > 0) parts.push(`$${(fixed / 100).toFixed(2)}`);
    return parts.join(" + ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Methods Management</h1>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {/* System Synchronization Info */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Global Payment System</h3>
              <p className="text-gray-600 mb-3">
                Changes made here automatically synchronize across all locations. When you configure API credentials 
                or modify payment methods, the system instantly updates all location payment options.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time synchronization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Automatic API configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Global availability control</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Method Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g., stripe, paypal, cash"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...form.register("displayName")}
                    placeholder="e.g., Credit/Debit Card, PayPal"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    {...form.register("provider")}
                    placeholder="e.g., stripe, paypal (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="processingFeePercent">Processing Fee (%)</Label>
                  <Input
                    id="processingFeePercent"
                    type="number"
                    step="0.01"
                    {...form.register("processingFeePercent", { valueAsNumber: true })}
                    placeholder="e.g., 2.9 for 2.9%"
                  />
                </div>
                <div>
                  <Label htmlFor="fixedFee">Fixed Fee (cents)</Label>
                  <Input
                    id="fixedFee"
                    type="number"
                    {...form.register("fixedFee", { valueAsNumber: true })}
                    placeholder="e.g., 30 for $0.30"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    {...form.register("isActive")}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailableToLocations"
                    {...form.register("isAvailableToLocations")}
                  />
                  <Label htmlFor="isAvailableToLocations">Available to Locations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresApi"
                    {...form.register("requiresApi")}
                  />
                  <Label htmlFor="requiresApi">Requires API</Label>
                </div>
              </div>

              {/* API Credentials Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">API Configuration (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      {...form.register("apiKey")}
                      placeholder="Enter API key for this payment provider"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      {...form.register("apiSecret")}
                      placeholder="Enter API secret"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      {...form.register("webhookSecret")}
                      placeholder="Enter webhook secret if required"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Adding API credentials will automatically configure and activate this payment method across all locations.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Method
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    form.reset();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id}>
            <CardContent className="p-6">
              {editingId === method.id ? (
                <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${method.id}`}>Method Name</Label>
                      <Input
                        id={`name-${method.id}`}
                        {...form.register("name")}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`displayName-${method.id}`}>Display Name</Label>
                      <Input
                        id={`displayName-${method.id}`}
                        {...form.register("displayName")}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`provider-${method.id}`}>Provider</Label>
                      <Input
                        id={`provider-${method.id}`}
                        {...form.register("provider")}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`processingFeePercent-${method.id}`}>Processing Fee (%)</Label>
                      <Input
                        id={`processingFeePercent-${method.id}`}
                        type="number"
                        step="0.01"
                        {...form.register("processingFeePercent", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`fixedFee-${method.id}`}>Fixed Fee (cents)</Label>
                      <Input
                        id={`fixedFee-${method.id}`}
                        type="number"
                        {...form.register("fixedFee", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`isActive-${method.id}`}
                        {...form.register("isActive")}
                      />
                      <Label htmlFor={`isActive-${method.id}`}>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`isAvailableToLocations-${method.id}`}
                        {...form.register("isAvailableToLocations")}
                      />
                      <Label htmlFor={`isAvailableToLocations-${method.id}`}>Available to Locations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`requiresApi-${method.id}`}
                        {...form.register("requiresApi")}
                      />
                      <Label htmlFor={`requiresApi-${method.id}`}>Requires API</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-semibold">{method.displayName}</h3>
                      <Badge variant={method.isActive ? "default" : "secondary"}>
                        {method.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={method.isAvailableToLocations ? "default" : "outline"}>
                        {method.isAvailableToLocations ? "Available to Locations" : "Not Available"}
                      </Badge>
                      {method.requiresApi && (
                        <Badge variant="outline">Requires API</Badge>
                      )}
                      {method.requiresApi && (
                        <Badge variant={method.isConfigured ? "default" : "destructive"}>
                          {method.isConfigured ? "API Configured" : "API Not Configured"}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <strong>Method:</strong> {method.name}
                      </div>
                      <div>
                        <strong>Provider:</strong> {method.provider || "Manual"}
                      </div>
                      <div>
                        <strong>Fees:</strong> {formatFee(method.processingFeePercent, method.fixedFee)}
                      </div>
                    </div>
                    {method.requiresApi && !method.isConfigured && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-yellow-800">
                          <strong>API Configuration Required:</strong> This payment method requires API credentials to function properly. 
                          Add your API keys to automatically activate this method across all locations.
                        </p>
                      </div>
                    )}
                    {method.isConfigured && method.isAvailableToLocations && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-green-800">
                          <strong>Synchronized:</strong> This payment method is configured and active across all locations.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(method)}
                      disabled={updateMutation.isPending}
                    >
                      {method.isAvailableToLocations ? "Hide from Locations" : "Make Available"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(method)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No payment methods configured yet.</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="mt-4 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}