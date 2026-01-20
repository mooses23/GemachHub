import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Search, RefreshCw, Home, DollarSign, ClipboardList, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useOperatorAuth } from "@/hooks/use-operator-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Location } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { OperatorTransactionForm } from "@/components/transactions/operator-transaction-form";

export default function OperatorDashboard() {
  const { operatorLocation, isLoading: isOperatorLoading, logout } = useOperatorAuth();
  const { toast } = useToast();
  const [currentPath] = useLocation();
  const [, setPath] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);

  useEffect(() => {
    if (!isOperatorLoading && !operatorLocation) {
      setPath("/auth");
    }
  }, [isOperatorLoading, operatorLocation, setPath]);

  // Query transactions for the operator's location
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

  // Mutation to mark transaction as returned
  const returnMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest("PATCH", `/api/transactions/${transactionId}/return`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit returned",
        description: "Transaction has been marked as returned and deposit refunded.",
      });
      // Close dialog and clear selection
      setIsReturnDialogOpen(false);
      setSelectedTransaction(null);
      // Invalidate transactions cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/locations", operatorLocation?.id, "transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error processing return",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle return confirmation
  const handleConfirmReturn = () => {
    if (selectedTransaction) {
      returnMutation.mutate(selectedTransaction.id);
    }
  };

  // Open return dialog with selected transaction
  const openReturnDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReturnDialogOpen(true);
  };

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    const searchTerms = searchQuery.toLowerCase();
    return (
      transaction.borrowerName.toLowerCase().includes(searchTerms) ||
      (transaction.borrowerEmail && transaction.borrowerEmail.toLowerCase().includes(searchTerms)) ||
      (transaction.borrowerPhone && transaction.borrowerPhone.toLowerCase().includes(searchTerms))
    );
  });

  // Show loading state
  if (isOperatorLoading || isTransactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
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
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Operator Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{operatorLocation.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/operator/dashboard">
            <Button 
              variant={currentPath === "/operator/dashboard" ? "default" : "outline"} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Transactions
            </Button>
          </Link>
          <Link href="/operator/deposits">
            <Button 
              variant={currentPath === "/operator/deposits" ? "default" : "outline"} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Deposits
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{operatorLocation.name} Dashboard</h1>
          <p className="text-muted-foreground">
            Manage borrower transactions and deposit returns
          </p>
        </div>
        
        <Card className="w-full md:w-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operatorLocation.inventoryCount} earmuffs</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or phone..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <OperatorTransactionForm />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Borrow Date</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? "No transactions match your search" : "No transactions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.borrowerName}</TableCell>
                      <TableCell>
                        {transaction.borrowerEmail && (
                          <div>{transaction.borrowerEmail}</div>
                        )}
                        {transaction.borrowerPhone && (
                          <div className="text-muted-foreground">{transaction.borrowerPhone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.borrowDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {transaction.expectedReturnDate 
                          ? format(new Date(transaction.expectedReturnDate), "MMM d, yyyy")
                          : "Not specified"}
                      </TableCell>
                      <TableCell>
                        {transaction.isReturned ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                            Returned
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>${transaction.depositAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {!transaction.isReturned && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() => openReturnDialog(transaction)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Process Return
                          </Button>
                        )}
                        {transaction.isReturned && transaction.actualReturnDate && (
                          <span className="text-sm text-muted-foreground">
                            Returned {format(new Date(transaction.actualReturnDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Return Confirmation Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return & Refund Deposit</DialogTitle>
            <DialogDescription>
              Confirm that this earmuff has been returned in good condition and the deposit should be refunded.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Borrower</p>
                  <p>{selectedTransaction.borrowerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Deposit Amount</p>
                  <p className="font-semibold">${selectedTransaction.depositAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  By confirming, you verify that:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                  <li>The earmuffs have been returned in good condition</li>
                  <li>The deposit has been refunded to the borrower</li>
                  <li>The earmuffs will be sanitized before the next use</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReturn}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing...
                </>
              ) : (
                "Confirm Return & Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}