import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Home, LogOut, Package, ArrowRight, ArrowLeft, Phone, User, DollarSign, Check, AlertTriangle, Plus, Search, RotateCcw } from "lucide-react";
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

function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Last 5 transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3">
                  {tx.headbandColor && <ColorSwatch color={tx.headbandColor} size="sm" />}
                  <div>
                    <div className="font-medium">{tx.borrowerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.borrowDate), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
                <Badge variant={tx.isReturned ? "outline" : "default"}>
                  {tx.isReturned ? "Returned" : "Active"}
                </Badge>
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
  const [depositAmount, setDepositAmount] = useState(location.depositAmount?.toString() || "20");
  const [depositEdited, setDepositEdited] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  
  // Custom handler to clear default value on first keypress
  const handleDepositChange = (newValue: string) => {
    if (!depositEdited) {
      // First edit - if user types a number, clear the default and use just the typed value
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
  
  const canProceed = () => {
    switch (step) {
      case 1: return selectedColor !== "";
      case 2: return borrowerName.trim() !== "" && borrowerPhone.trim() !== "";
      case 3: return parseFloat(depositAmount) > 0;
      case 4: return true;
      default: return false;
    }
  };
  
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      createTransactionMutation.mutate();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
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
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                size="lg"
                onClick={() => setPaymentMethod("cash")}
                className="flex-1 max-w-[150px]"
              >
                <DollarSign className="h-5 w-5 mr-2" /> Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                size="lg"
                onClick={() => setPaymentMethod("card")}
                className="flex-1 max-w-[150px]"
              >
                💳 Card
              </Button>
            </div>
            
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
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          disabled={createTransactionMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed() || createTransactionMutation.isPending}
        >
          {createTransactionMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
          ) : step === 4 ? (
            <><Check className="h-4 w-4 mr-2" /> Confirm Lend</>
          ) : (
            <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
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
  
  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTransaction) throw new Error("No transaction selected");
      
      const refund = isPartialRefund ? parseFloat(refundAmount) : selectedTransaction.depositAmount;
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations", location.id, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/location"] });
      toast({ title: "Success!", description: "Return processed successfully." });
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
      returnMutation.mutate();
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return selectedTransaction !== null;
      case 2: return parseFloat(refundAmount) >= 0;
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
          <h3 className="text-lg font-semibold mb-4">Select Borrower</h3>
          
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
          <h3 className="text-lg font-semibold mb-4">Refund Deposit</h3>
          
          <div className="mb-6 p-4 bg-muted/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span>Original Deposit</span>
              <span className="font-bold text-lg">${selectedTransaction.depositAmount.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Paid via {selectedTransaction.depositPaymentMethod || "cash"}
            </div>
          </div>
          
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
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          disabled={returnMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed() || returnMutation.isPending}
        >
          {returnMutation.isPending ? (
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
            <RecentActivity transactions={transactions} />
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
