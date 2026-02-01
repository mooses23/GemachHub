import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Home, LogOut, Package, ArrowRight, ArrowLeft, Phone, User, DollarSign, Check, AlertTriangle, Plus, Search, RotateCcw, CreditCard, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useOperatorAuth } from "@/hooks/use-operator-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Location, HEADBAND_COLORS, InventoryByColor } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isAfter, addDays } from "date-fns";
import StripeSetupCheckout from "@/components/payment/stripe-setup-checkout";

const COLOR_SWATCHES: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#1F2937",
  white: "#F9FAFB",
  pink: "#EC4899",
  purple: "#8B5CF6",
  green: "#22C55E",
  orange: "#F97316",
  yellow: "#EAB308",
  gray: "#6B7280",
};

function ColorSwatch({ color, size = "md" }: { color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  const bgColor = COLOR_SWATCHES[color] || "#9CA3AF";
  const isLight = color === "white" || color === "yellow";
  
  return (
    <div 
      className={`${sizes[size]} rounded-full border-2 ${isLight ? 'border-gray-300' : 'border-transparent'}`}
      style={{ backgroundColor: bgColor }}
    />
  );
}

function StockOverview({ inventory, totalStock, onAddStock, onEditStock }: { inventory: { color: string; quantity: number }[]; totalStock: number; onAddStock: () => void; onEditStock: (color: string, currentQty: number) => void }) {
  const inventoryByColor = inventory.reduce((acc, item) => ({ ...acc, [item.color]: item.quantity }), {} as InventoryByColor);
  
  const lowStockThreshold = 3;
  const lowStockColors = Object.entries(inventoryByColor).filter(([_, qty]) => (qty || 0) <= lowStockThreshold && (qty || 0) > 0);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Overview
            </CardTitle>
            <CardDescription>Current headband inventory by color (tap to edit)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onAddStock}>
            <Plus className="h-4 w-4 mr-1" /> Add Stock
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-3xl font-bold">{totalStock}</div>
          <div className="text-sm text-muted-foreground">Total headbands in stock</div>
        </div>
        
        {lowStockColors.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" /> Low Stock Alert
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockColors.map(([color, qty]) => (
                <Badge key={color} variant="outline" className="bg-yellow-100 border-yellow-300">
                  <ColorSwatch color={color} size="sm" />
                  <span className="ml-1 capitalize">{color}: {qty}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(inventoryByColor).filter(([_, qty]) => (qty || 0) > 0).map(([color, qty]) => (
            <button
              key={color}
              onClick={() => onEditStock(color, qty || 0)}
              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer text-left"
            >
              <ColorSwatch color={color} />
              <div>
                <div className="text-sm capitalize font-medium">{color}</div>
                <div className="text-lg font-bold">{qty}</div>
              </div>
            </button>
          ))}
          {inventory.length === 0 && (
            <div className="col-span-full text-center py-4 text-muted-foreground">
              No inventory data. Add stock to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RestockingInstructions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Baby Banz Restocking Instructions
        </CardTitle>
        <CardDescription>How to reorder Baby Banz inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">U.S. and Canada Orders:</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Go to <a href="https://usa.banzworld.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" aria-label="Visit Baby Banz USA and Canada website">usa.banzworld.com</a></li>
              <li>Click on "Account"</li>
              <li>
                Log in using the shared Baby Banz account.
                If you do not have access to the login details, please contact an administrator
                or refer to the internal credentials documentation.
              </li>
              <li>The 50% discount and free shipping should apply automatically</li>
              <li>Enter your shipping and payment information (delete previous purchaser's information if needed)</li>
            </ol>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">If discounts don't auto-populate:</h4>
            <p className="mb-2">Use these discount codes:</p>
            <div className="space-y-2 ml-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="font-mono">GEMACHSHIP</Badge>
                <span>for free shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">COMBINE WITH</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="font-mono">GEMACH</Badge>
                <span>for 50% off</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground italic">
              Note: The sales platform has been making changes that have affected some of the pricing structures on the backend, 
              so this is the easiest workaround to ensure smooth sailing moving forward.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ transactions, locationCode }: { transactions: Transaction[]; locationCode?: string }) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 5 transactions</CardDescription>
          </div>
          {locationCode && (
            <Badge variant="outline" className="text-sm">
              Gemach {locationCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {tx.headbandColor && <ColorSwatch color={tx.headbandColor} size="sm" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.borrowerName}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        TX#{tx.id}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.borrowDate), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={tx.isReturned ? "outline" : "default"} className="mb-1">
                    {tx.isReturned ? "Returned" : "Active"}
                  </Badge>
                  <div className="text-xs font-medium">${tx.depositAmount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NumericKeypad({ value, onChange, maxValue = 999 }: { value: string; onChange: (val: string) => void; maxValue?: number }) {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else if (key === ".") {
      if (!value.includes(".")) {
        onChange(value + ".");
      }
    } else {
      const newValue = value + key;
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue) && numValue <= maxValue) {
        onChange(newValue);
      }
    }
  };
  
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];
  
  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {keys.map((key) => (
        <Button
          key={key}
          variant="outline"
          size="lg"
          className="h-14 text-xl font-semibold"
          onClick={() => handleKeyPress(key)}
        >
          {key === "backspace" ? "⌫" : key}
        </Button>
      ))}
    </div>
  );
}

function LendWizard({ 
  location, 
  inventory,
  onComplete, 
  onCancel,
  transactions = []
}: { 
  location: Location; 
  inventory: { color: string; quantity: number }[];
  onComplete: () => void; 
  onCancel: () => void;
  transactions?: Transaction[];
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState(location.depositAmount?.toString() || "20");
  const [depositEdited, setDepositEdited] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  
  const handleDepositChange = (newValue: string) => {
    if (!depositEdited) {
      if (newValue.length > depositAmount.length) {
        const typedChar = newValue.slice(-1);
        if (/[0-9]/.test(typedChar)) {
          setDepositAmount(typedChar);
          setDepositEdited(true);
          return;
        }
      }
      setDepositEdited(true);
    }
    setDepositAmount(newValue);
  };
  
  const availableColors = inventory.filter(item => item.quantity > 0).map(item => [item.color, item.quantity] as [string, number]);
  
  useEffect(() => {
    if (borrowerPhone.trim()) {
      const previousBorrower = transactions.find(tx => tx.borrowerPhone === borrowerPhone);
      if (previousBorrower && !borrowerName) {
        setBorrowerName(previousBorrower.borrowerName);
      }
    }
  }, [borrowerPhone, transactions, borrowerName]);
  
  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transactions", {
        locationId: location.id,
        borrowerName,
        borrowerPhone,
        headbandColor: selectedColor,
        depositAmount: parseFloat(depositAmount),
        depositPaymentMethod: paymentMethod,
        expectedReturnDate: addDays(new Date(), 7).toISOString(),
      });
      return res.json();
    },
    onSuccess: async () => {
      await apiRequest("DELETE", `/api/locations/${location.id}/inventory`, {
        color: selectedColor,
        quantity: 1,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
      toast({ title: "Success!", description: "Headband lent successfully." });
      onComplete();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const PLACEHOLDER_EMAIL_DOMAIN = "@placeholder.local";

  const initiateCardSetup = async () => {
    setIsInitiatingPayment(true);
    try {
      const emailToUse = borrowerEmail.trim() || `${borrowerPhone.replace(/\D/g, '')}${PLACEHOLDER_EMAIL_DOMAIN}`;
      const amountCents = Math.round(parseFloat(depositAmount) * 100);
      
      const res = await apiRequest("POST", "/api/deposits/setup-intent", {
        locationId: location.id,
        borrowerName,
        borrowerEmail: emailToUse,
        borrowerPhone,
        amountCents,
        headbandColor: selectedColor,
      });
      
      const data = await res.json();
      
      if (data.clientSecret && data.publishableKey) {
        setStripeClientSecret(data.clientSecret);
        setStripePublishableKey(data.publishableKey);
        setStep(5);
      } else {
        throw new Error(data.message || "Failed to initialize card setup");
      }
    } catch (error: any) {
      toast({ 
        title: "Card Setup Error", 
        description: error.message || "Failed to initialize card setup", 
        variant: "destructive" 
      });
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const handleStripeError = (error: string) => {
    toast({ 
      title: "Payment Failed", 
      description: error, 
      variant: "destructive" 
    });
  };
  
  const totalSteps = paymentMethod === "card" ? 5 : 4;
  
  const canProceed = () => {
    switch (step) {
      case 1: return selectedColor !== "";
      case 2: return borrowerName.trim() !== "" && borrowerPhone.trim() !== "";
      case 3: return parseFloat(depositAmount) > 0;
      case 4: return true;
      case 5: return false;
      default: return false;
    }
  };
  
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      if (paymentMethod === "card") {
        initiateCardSetup();
      } else {
        createTransactionMutation.mutate();
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={step === 5}>Cancel</Button>
      </div>
      
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Headband Color</h3>
          {availableColors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No headbands available. Please add stock first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableColors.map(([color, qty]) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all
                    ${selectedColor === color ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                >
                  <ColorSwatch color={color} size="lg" />
                  <span className="capitalize font-medium">{color}</span>
                  <Badge variant="secondary">{qty} available</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Borrower Information</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Enter borrower's name"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Enter phone number"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Deposit Payment</h3>
          <div className="space-y-6">
            <div className="flex justify-center gap-3 mb-6">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                size="lg"
                onClick={() => setPaymentMethod("cash")}
                className="flex-1 max-w-[160px]"
              >
                <DollarSign className="h-5 w-5 mr-1" /> Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                size="lg"
                onClick={() => setPaymentMethod("card")}
                className="flex-1 max-w-[160px]"
              >
                <CreditCard className="h-5 w-5 mr-1" /> Card
              </Button>
            </div>
            
            {paymentMethod === "card" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>Borrower will save their card. You can charge it when they return the item.</span>
                </div>
              </div>
            )}
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold">${depositAmount || "0"}</div>
              <div className="text-sm text-muted-foreground">Deposit Amount</div>
            </div>
            
            <NumericKeypad value={depositAmount} onChange={handleDepositChange} />
          </div>
        </div>
      )}
      
      {step === 4 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Confirm Details</h3>
          <div className="max-w-md space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Headband Color</span>
              <div className="flex items-center gap-2">
                <ColorSwatch color={selectedColor} size="sm" />
                <span className="capitalize font-medium">{selectedColor}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Borrower</span>
              <span className="font-medium">{borrowerName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{borrowerPhone}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-bold text-lg">${depositAmount}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Payment Method</span>
              <Badge variant="outline" className="capitalize">{paymentMethod}</Badge>
            </div>
          </div>
          {paymentMethod === "card" && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Borrower will save their card. You can charge it when they return the item.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 5 && stripeClientSecret && stripePublishableKey && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Save Card for Deposit</h3>
          <div className="max-w-md mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Amount to authorize:</span>
              <span className="font-bold">${depositAmount}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">Borrower:</span>
              <span>{borrowerName}</span>
            </div>
          </div>
          <StripeSetupCheckout
            clientSecret={stripeClientSecret}
            publishableKey={stripePublishableKey}
            onSuccess={async () => {
              try {
                // For card deposit, we need to assign the headband and update inventory
                await apiRequest("DELETE", `/api/locations/${location.id}/inventory`, {
                  color: selectedColor,
                  quantity: 1,
                });
                queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
                queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
                queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
                queryClient.invalidateQueries({ queryKey: ["/api/operator/transactions/pending"] });
                toast({ title: "Success!", description: "Card saved and headband lent successfully." });
                onComplete();
              } catch (error: any) {
                toast({ 
                  title: "Error updating inventory", 
                  description: error.message || "Card was saved but failed to update inventory. Please check manually.", 
                  variant: "destructive" 
                });
                // Still complete since the card was saved successfully
                onComplete();
              }
            }}
            onError={handleStripeError}
          />
        </div>
      )}
      
      {step !== 5 && (
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            disabled={createTransactionMutation.isPending || isInitiatingPayment}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!canProceed() || createTransactionMutation.isPending || isInitiatingPayment}
          >
            {createTransactionMutation.isPending || isInitiatingPayment ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : step === 4 && paymentMethod === "card" ? (
              <><CreditCard className="h-4 w-4 mr-2" /> Save Card</>
            ) : step === 4 ? (
              <><Check className="h-4 w-4 mr-2" /> Confirm Lend</>
            ) : (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ReturnWizard({ 
  location, 
  transactions,
  onComplete, 
  onCancel 
}: { 
  location: Location; 
  transactions: Transaction[];
  onComplete: () => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [cardAction, setCardAction] = useState<"charge" | "release" | null>(null);

  useEffect(() => {
    setCardAction(null);
  }, [selectedTransaction]);
  
  const activeTransactions = transactions.filter(tx => !tx.isReturned);
  
  const filteredTransactions = searchPhone
    ? activeTransactions.filter(tx => 
        tx.borrowerPhone?.includes(searchPhone) || 
        tx.borrowerName.toLowerCase().includes(searchPhone.toLowerCase())
      )
    : activeTransactions;
  
  const isOverdue = (tx: Transaction) => {
    if (!tx.expectedReturnDate) return false;
    return isAfter(new Date(), new Date(tx.expectedReturnDate));
  };
  
  const chargeCardMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest("POST", `/api/operator/transactions/${transactionId}/charge`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: "Card charged successfully.",
        });
      } else if (data.requiresAction) {
        toast({
          title: "Action Required",
          description: "Customer needs to complete additional authentication.",
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/transactions/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to charge card",
        variant: "destructive",
      });
    },
  });

  const releaseCardMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest("POST", `/api/operator/transactions/${transactionId}/decline`, {
        reason: "Released by operator",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Card released.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/transactions/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to release card",
        variant: "destructive",
      });
    },
  });
  
  const returnMutation = useMutation({
    mutationFn: async (overrideRefund?: { refundAmount: number }) => {
      if (!selectedTransaction) throw new Error("No transaction selected");
      
      // Use override if provided, otherwise calculate from state
      const refund = overrideRefund !== undefined 
        ? overrideRefund.refundAmount 
        : (isPartialRefund ? parseFloat(refundAmount) : selectedTransaction.depositAmount);
      
      const res = await apiRequest("PATCH", `/api/transactions/${selectedTransaction.id}/return`, {
        refundAmount: refund,
      });
      
      if (selectedTransaction.headbandColor) {
        await apiRequest("POST", `/api/locations/${location.id}/inventory`, {
          color: selectedTransaction.headbandColor,
          quantity: 1,
        });
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
      
      const refundAmt = data?.refundAmount ?? selectedTransaction?.depositAmount ?? 0;
      const refundMsg = data?.refundProcessed 
        ? `Stripe refund of $${refundAmt.toFixed(2)} has been processed.`
        : "Return processed successfully.";
      toast({ title: "Success!", description: refundMsg });
      onComplete();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  useEffect(() => {
    if (selectedTransaction) {
      if (!isPartialRefund) {
        setRefundAmount(selectedTransaction.depositAmount.toString());
      } else {
        // Clear the amount when switching to partial refund so user can enter fresh value
        setRefundAmount("");
      }
    }
  }, [selectedTransaction, isPartialRefund]);
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Check if this is a card deposit transaction
      if (selectedTransaction?.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED") {
        if (cardAction === "charge") {
          // First charge the card, then process return
          chargeCardMutation.mutate(selectedTransaction.id, {
            onSuccess: () => {
              // After charging, process the return
              returnMutation.mutate();
            },
            onError: (error) => {
              toast({
                title: "Charge Failed",
                description: error.message || "Failed to charge card. Return not processed.",
                variant: "destructive",
              });
            }
          });
        } else if (cardAction === "release") {
          // Release the card, then process return
          releaseCardMutation.mutate(selectedTransaction.id, {
            onSuccess: () => {
              // After releasing, process the return with no refund
              returnMutation.mutate({ refundAmount: 0 });
            },
            onError: (error) => {
              toast({
                title: "Release Failed",
                description: error.message || "Failed to release card. Return not processed.",
                variant: "destructive",
              });
            }
          });
        }
      } else {
        returnMutation.mutate();
      }
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return selectedTransaction !== null;
      case 2: 
        // For card deposit transactions, must select an action
        if (selectedTransaction?.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED") {
          return cardAction !== null;
        }
        return parseFloat(refundAmount) >= 0;
      case 3: return true;
      default: return false;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      
      {step === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Select Borrower</h3>
            {location.locationCode && (
              <Badge variant="outline" className="text-sm">
                Gemach {location.locationCode}
              </Badge>
            )}
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by phone or name..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </div>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {activeTransactions.length === 0 
                ? "No active borrowers" 
                : "No borrowers match your search"}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTransactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className={`w-full p-4 border-2 rounded-xl flex items-center justify-between transition-all text-left
                    ${selectedTransaction?.id === tx.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                >
                  <div className="flex items-center gap-3">
                    {tx.headbandColor && <ColorSwatch color={tx.headbandColor} />}
                    <div>
                      <div className="font-medium">{tx.borrowerName}</div>
                      <div className="text-sm text-muted-foreground">{tx.borrowerPhone}</div>
                      <div className="text-xs text-muted-foreground">
                        Borrowed: {format(new Date(tx.borrowDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${tx.depositAmount.toFixed(2)}</div>
                    {tx.payLaterStatus && tx.payLaterStatus !== "CHARGED" && (
                      <Badge variant="secondary" className="mt-1">
                        <CreditCard className="h-3 w-3 mr-1" /> Card
                      </Badge>
                    )}
                    {isOverdue(tx) && (
                      <Badge variant="destructive" className="mt-1">Overdue</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {step === 2 && selectedTransaction && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {selectedTransaction.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED" 
              ? "Process Card Deposit" 
              : "Refund Deposit"}
          </h3>
          
          <div className="mb-6 p-4 bg-muted/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span>Original Deposit</span>
              <span className="font-bold text-lg">${selectedTransaction.depositAmount.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Paid via {selectedTransaction.depositPaymentMethod || "cash"}
              {selectedTransaction.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED" && (
                <Badge variant="secondary" className="ml-2">
                  <CreditCard className="h-3 w-3 mr-1" /> Card Deposit
                </Badge>
              )}
            </div>
          </div>
          
          {/* Card deposit specific options */}
          {selectedTransaction.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED" ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2 text-blue-800 text-sm mb-3">
                  <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>This borrower saved their card for the deposit. You can now charge their card or release it without charging.</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant={cardAction === "charge" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setCardAction("charge")}
                  className="flex-1"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Charge Card
                </Button>
                <Button
                  variant={cardAction === "release" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setCardAction("release")}
                  className="flex-1"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Release Card
                </Button>
              </div>
              
              {cardAction === "charge" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>The card will be charged ${selectedTransaction.depositAmount.toFixed(2)} when you confirm.</span>
                  </div>
                </div>
              )}
              
              {cardAction === "release" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-800 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>The saved card will be released and no charge will be made.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {selectedTransaction.depositPaymentMethod === "stripe" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>This was a card payment. The refund will be processed automatically to the original card.</span>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <Button
                    variant={!isPartialRefund ? "default" : "outline"}
                    onClick={() => {
                      setIsPartialRefund(false);
                      setRefundAmount(selectedTransaction.depositAmount.toString());
                    }}
                    className="flex-1"
                  >
                    Full Refund
                  </Button>
                  <Button
                    variant={isPartialRefund ? "default" : "outline"}
                    onClick={() => setIsPartialRefund(true)}
                    className="flex-1"
                  >
                    Partial Refund
                  </Button>
                </div>
                
                {isPartialRefund && (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold">${refundAmount || "0"}</div>
                      <div className="text-sm text-muted-foreground">Refund Amount</div>
                    </div>
                    <NumericKeypad 
                      value={refundAmount} 
                      onChange={setRefundAmount}
                      maxValue={selectedTransaction.depositAmount}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {step === 3 && selectedTransaction && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Confirm Return</h3>
          <div className="max-w-md space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Borrower</span>
              <span className="font-medium">{selectedTransaction.borrowerName}</span>
            </div>
            {selectedTransaction.headbandColor && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Headband Color</span>
                <div className="flex items-center gap-2">
                  <ColorSwatch color={selectedTransaction.headbandColor} size="sm" />
                  <span className="capitalize font-medium">{selectedTransaction.headbandColor}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Original Deposit</span>
              <span className="font-medium">${selectedTransaction.depositAmount.toFixed(2)}</span>
            </div>
            
            {/* Show card deposit action if applicable */}
            {selectedTransaction.payLaterStatus && selectedTransaction.payLaterStatus !== "CHARGED" ? (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Action</span>
                  <Badge variant={cardAction === "charge" ? "default" : "secondary"}>
                    {cardAction === "charge" ? "Charge Card" : "Release Card"}
                  </Badge>
                </div>
                {cardAction === "charge" ? (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Charge Amount</span>
                    <span className="font-bold text-lg text-green-600">
                      ${selectedTransaction.depositAmount.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    No charge will be made. Card will be released.
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="font-bold text-lg text-green-600">
                    ${(isPartialRefund ? parseFloat(refundAmount) : selectedTransaction.depositAmount).toFixed(2)}
                  </span>
                </div>
                {isPartialRefund && parseFloat(refundAmount) < selectedTransaction.depositAmount && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Deduction</span>
                    <span className="text-red-500">
                      -${(selectedTransaction.depositAmount - parseFloat(refundAmount)).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          disabled={returnMutation.isPending || chargeCardMutation.isPending || releaseCardMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed() || returnMutation.isPending || chargeCardMutation.isPending || releaseCardMutation.isPending}
        >
          {(returnMutation.isPending || chargeCardMutation.isPending || releaseCardMutation.isPending) ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
          ) : step === 3 ? (
            <><Check className="h-4 w-4 mr-2" /> Confirm Return</>
          ) : (
            <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

function AddStockDialog({ 
  location, 
  open, 
  onOpenChange 
}: { 
  location: Location; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  
  const addStockMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/locations/${location.id}/inventory`, {
        color: selectedColor,
        quantity: parseInt(quantity),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
      toast({ title: "Success!", description: `Added ${quantity} ${selectedColor} headband(s) to stock.` });
      onOpenChange(false);
      setSelectedColor("");
      setQuantity("1");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>Add new headbands to your inventory</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Color</label>
            <div className="grid grid-cols-5 gap-2">
              {HEADBAND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`p-2 border-2 rounded-lg flex flex-col items-center gap-1 transition-all
                    ${selectedColor === color ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                >
                  <ColorSwatch color={color} />
                  <span className="text-xs capitalize">{color}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, parseInt(quantity) - 1).toString())}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                className="w-20 text-center"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((parseInt(quantity) + 1).toString())}
              >
                +
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => addStockMutation.mutate()}
            disabled={!selectedColor || !quantity || addStockMutation.isPending}
          >
            {addStockMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
            ) : (
              <>Add {quantity} {selectedColor}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStockDialog({ 
  location, 
  open, 
  onOpenChange,
  color,
  currentQty
}: { 
  location: Location; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  color: string;
  currentQty: number;
}) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(currentQty.toString());
  
  useEffect(() => {
    setQuantity(currentQty.toString());
  }, [currentQty, open]);
  
  const updateStockMutation = useMutation({
    mutationFn: async () => {
      const newQty = parseInt(quantity);
      const diff = newQty - currentQty;
      if (diff > 0) {
        const res = await apiRequest("POST", `/api/locations/${location.id}/inventory`, {
          color,
          quantity: diff,
        });
        return res.json();
      } else if (diff < 0) {
        const res = await apiRequest("DELETE", `/api/locations/${location.id}/inventory`, {
          color,
          quantity: Math.abs(diff),
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
      toast({ title: "Success!", description: `Updated ${color} stock to ${quantity}.` });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const newQty = parseInt(quantity) || 0;
  const diff = newQty - currentQty;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ColorSwatch color={color} />
            <span className="capitalize">Edit {color} Stock</span>
          </DialogTitle>
          <DialogDescription>Adjust the quantity for this color</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">Quantity</label>
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(0, parseInt(quantity) - 1).toString())}
            >
              -
            </Button>
            <Input
              type="number"
              min="0"
              className="w-24 text-center text-lg font-bold"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((parseInt(quantity) + 1).toString())}
            >
              +
            </Button>
          </div>
          {diff !== 0 && (
            <p className={`text-center mt-2 text-sm ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff > 0 ? `+${diff}` : diff} from current stock
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => updateStockMutation.mutate()}
            disabled={diff === 0 || updateStockMutation.isPending}
          >
            {updateStockMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
            ) : (
              <>Update Stock</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayLaterTransactions({ location }: { location: Location }) {
  const { toast } = useToast();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedTransactionForDecline, setSelectedTransactionForDecline] = useState<Transaction | null>(null);

  const { 
    data: pendingTransactions = [], 
    isLoading,
    refetch
  } = useQuery<Transaction[]>({
    queryKey: ["/api/operator/transactions/pending"],
    queryFn: async () => {
      const res = await fetch("/api/operator/transactions/pending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pending transactions");
      return res.json();
    },
  });

  const chargeMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest("POST", `/api/operator/transactions/${transactionId}/charge`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: "Transaction charged successfully.",
        });
      } else if (data.requiresAction) {
        toast({
          title: "Action Required",
          description: "Customer needs to complete additional authentication.",
          variant: "default",
        });
      }
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to charge transaction",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTransactionForDecline) throw new Error("No transaction selected");
      const res = await apiRequest("POST", `/api/operator/transactions/${selectedTransactionForDecline.id}/decline`, {
        reason: declineReason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Transaction declined.",
      });
      setDeclineDialogOpen(false);
      setDeclineReason("");
      setSelectedTransactionForDecline(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline transaction",
        variant: "destructive",
      });
    },
  });

  const handleDeclineClick = (transaction: Transaction) => {
    setSelectedTransactionForDecline(transaction);
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = () => {
    declineMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (pendingTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No pending card deposit transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pending Card Deposits ({pendingTransactions.length})
          </CardTitle>
          <CardDescription>Approve and charge customer cards or decline requests</CardDescription>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Pay Later Transactions ({pendingTransactions.length})
              </CardTitle>
              <CardDescription>Approve and charge customer cards or decline requests</CardDescription>
            </div>
            {location.locationCode && (
              <Badge variant="outline" className="text-sm">
                Gemach {location.locationCode}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="font-medium">{tx.borrowerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {tx.borrowerPhone && <span>{tx.borrowerPhone}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {format(new Date(tx.borrowDate), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold">${tx.depositAmount.toFixed(2)}</div>
                      <Badge variant="secondary" className="mt-1">
                        {tx.payLaterStatus || "SETUP_COMPLETE"}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => chargeMutation.mutate(tx.id)}
                        disabled={chargeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {chargeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve & Charge
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeclineClick(tx)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Decline Transaction
            </DialogTitle>
            <DialogDescription>
              {selectedTransactionForDecline?.borrowerName && (
                <span>
                  Are you sure you want to decline this card deposit request from {selectedTransactionForDecline.borrowerName}?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTransactionForDecline && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">${selectedTransactionForDecline.depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Borrower:</span>
                  <span>{selectedTransactionForDecline.borrowerName}</span>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Decline Reason (optional)</label>
              <Input
                placeholder="E.g., Unable to verify borrower"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineDialogOpen(false);
                setDeclineReason("");
                setSelectedTransactionForDecline(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineConfirm}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Declining...</>
              ) : (
                <>Decline Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OperatorDashboard() {
  const { operatorLocation, isLoading: isOperatorLoading, logout } = useOperatorAuth();
  const { toast } = useToast();
  const [, setPath] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "lend" | "return">("overview");
  const [showAddStock, setShowAddStock] = useState(false);
  const [editStockColor, setEditStockColor] = useState<string | null>(null);
  const [editStockQty, setEditStockQty] = useState(0);

  useEffect(() => {
    if (!isOperatorLoading && !operatorLocation) {
      setPath("/auth");
    }
  }, [isOperatorLoading, operatorLocation, setPath]);

  const { 
    data: transactions = [], 
    isLoading: isTransactionsLoading,
    isError,
    error
  } = useQuery<Transaction[]>({
    queryKey: ["/api/locations", operatorLocation?.id, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${operatorLocation?.id}/transactions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!operatorLocation?.id,
  });

  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery<{ inventory: { color: string; quantity: number }[]; total: number }>({
    queryKey: ["/api/locations", operatorLocation?.id, "inventory"],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${operatorLocation?.id}/inventory`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
    enabled: !!operatorLocation?.id,
  });

  if (isOperatorLoading || isTransactionsLoading || isInventoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !operatorLocation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error?.message || "Failed to load operator data"}</p>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] })}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const activeLoans = transactions.filter(tx => !tx.isReturned).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-1" /> Home
                </Button>
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold">{operatorLocation.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">{operatorLocation.name}</h1>
              <p className="text-muted-foreground">Manage headband lending and returns</p>
            </div>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <Package className="h-4 w-4" /> Stock
              </TabsTrigger>
              <TabsTrigger value="lend" className="gap-2">
                <ArrowRight className="h-4 w-4" /> Lend
              </TabsTrigger>
              <TabsTrigger value="return" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Return
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{inventoryData?.total || 0}</div>
                <p className="text-sm text-muted-foreground">Total in Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{activeLoans}</div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  ${transactions.filter(tx => !tx.isReturned).reduce((sum, tx) => sum + tx.depositAmount, 0).toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">Deposits Held</p>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <StockOverview 
              inventory={inventoryData?.inventory || []} 
              totalStock={inventoryData?.total || 0} 
              onAddStock={() => setShowAddStock(true)} 
              onEditStock={(color, qty) => { setEditStockColor(color); setEditStockQty(qty); }}
            />
            <RestockingInstructions />
            <RecentActivity transactions={transactions} />
            <RecentActivity transactions={transactions} locationCode={operatorLocation.locationCode} />
          </TabsContent>

          <TabsContent value="lend">
            <Card>
              <CardContent className="pt-6">
                <LendWizard
                  location={operatorLocation}
                  inventory={inventoryData?.inventory || []}
                  transactions={transactions}
                  onComplete={() => setActiveTab("overview")}
                  onCancel={() => setActiveTab("overview")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="return">
            <Card>
              <CardContent className="pt-6">
                <ReturnWizard
                  location={operatorLocation}
                  transactions={transactions}
                  onComplete={() => setActiveTab("overview")}
                  onCancel={() => setActiveTab("overview")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddStockDialog 
        location={operatorLocation} 
        open={showAddStock} 
        onOpenChange={setShowAddStock} 
      />
      
      <EditStockDialog 
        location={operatorLocation} 
        open={!!editStockColor} 
        onOpenChange={(open) => !open && setEditStockColor(null)}
        color={editStockColor || ""}
        currentQty={editStockQty}
      />
    </div>
  );
}
