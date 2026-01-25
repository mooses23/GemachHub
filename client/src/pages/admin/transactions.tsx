import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLocations, getTransactions, markTransactionReturned } from "@/lib/api";
import { Location, Transaction } from "@shared/schema";
import { TransactionForm } from "@/components/admin/transaction-form";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  MoreVertical,
  RotateCw,
  Calendar,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Home,
  AlertCircle,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "returned">("all");
  
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const markReturnedMutation = useMutation({
    mutationFn: ({ id, refundAmount, notes }: { id: number; refundAmount?: number; notes?: string }) => 
      markTransactionReturned(id, { refundAmount, notes }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Earmuffs have been marked as returned and refund processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      closeRefundDialog();
    },
    onError: (error: any) => {
      // Enhanced error messages for refund failures
      let errorMessage = error.message || "Failed to process refund";
      
      // Provide specific feedback based on error type
      if (error.message?.includes('already marked as returned')) {
        errorMessage = "This transaction has already been marked as returned.";
      } else if (error.message?.includes('no completed payment')) {
        errorMessage = "Cannot process refund: No completed payment found for this transaction.";
      } else if (error.message?.includes('not authorized')) {
        errorMessage = "You are not authorized to process this refund.";
      } else if (error.message?.includes('refund in progress')) {
        errorMessage = "A refund is already in progress for this transaction.";
      } else if (error.message?.includes('validation failed')) {
        errorMessage = `Refund validation failed: ${error.message}`;
      }
      
      toast({
        title: "Refund Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const openRefundDialog = (transaction: Transaction) => {
    setRefundTransaction(transaction);
    setIsFullRefund(true);
    setRefundAmount(transaction.depositAmount?.toString() || "0");
    setRefundNotes("");
    setConfirmStep(false);
    setIsRefundDialogOpen(true);
  };

  const closeRefundDialog = () => {
    setIsRefundDialogOpen(false);
    setRefundTransaction(null);
    setIsFullRefund(true);
    setRefundAmount("");
    setRefundNotes("");
    setConfirmStep(false);
  };

  const handleProcessRefund = () => {
    if (!refundTransaction) return;
    
    const amount = isFullRefund ? refundTransaction.depositAmount : parseFloat(refundAmount);
    
    markReturnedMutation.mutate({
      id: refundTransaction.id,
      refundAmount: amount || 0,
      notes: refundNotes || undefined,
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  };

  const getLocationNameById = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : "Unknown";
  };

  const getRefundStatus = (transaction: Transaction) => {
    if (!transaction.isReturned) return null;
    
    const refund = transaction.refundAmount ?? 0;
    const deposit = transaction.depositAmount ?? 0;
    
    if (refund === 0) return "none";
    if (refund >= deposit) return "full";
    return "partial";
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterStatus === "active" && transaction.isReturned) return false;
    if (filterStatus === "returned" && !transaction.isReturned) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.borrowerName.toLowerCase().includes(searchLower) ||
      (transaction.borrowerEmail && transaction.borrowerEmail.toLowerCase().includes(searchLower)) ||
      (transaction.borrowerPhone && transaction.borrowerPhone.toLowerCase().includes(searchLower)) ||
      getLocationNameById(transaction.locationId).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/admin'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Transactions</h1>
            <p className="text-muted-foreground">Track deposits and earmuff borrowing</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Record New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new deposit for borrowed earmuffs.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm 
                  locations={locations} 
                  onSuccess={() => setIsCreateDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Manage earmuff loans and track deposits
            </CardDescription>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={filterStatus === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button 
                  variant={filterStatus === "active" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button 
                  variant={filterStatus === "returned" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("returned")}
                >
                  Returned
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => {
                      const isOverdue = !transaction.isReturned && 
                        transaction.expectedReturnDate && 
                        new Date(transaction.expectedReturnDate) < new Date();
                      
                      const refundStatus = getRefundStatus(transaction);
                        
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="font-medium flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {transaction.borrowerName}
                            </div>
                            {transaction.borrowerEmail && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {transaction.borrowerEmail}
                              </div>
                            )}
                            {transaction.borrowerPhone && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {transaction.borrowerPhone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getLocationNameById(transaction.locationId)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">${transaction.depositAmount}</Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.isReturned ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">${transaction.refundAmount ?? 0}</span>
                                </div>
                                {refundStatus === "full" && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    Full Refund
                                  </Badge>
                                )}
                                {refundStatus === "partial" && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    Partial
                                  </Badge>
                                )}
                                {refundStatus === "none" && (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    No Refund
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(transaction.borrowDate), "MMM d, yyyy")}
                              </span>
                            </div>
                            {transaction.expectedReturnDate && (
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Due: {format(new Date(transaction.expectedReturnDate), "MMM d, yyyy")}
                                </span>
                                {isOverdue && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Past expected return date</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                            {transaction.actualReturnDate && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Returned: {format(new Date(transaction.actualReturnDate), "MMM d, yyyy")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.isReturned ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Returned
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                {!transaction.isReturned && (
                                  <DropdownMenuItem onClick={() => openRefundDialog(transaction)}>
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Mark as Returned
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm || filterStatus !== "all" ? (
                          <p className="text-muted-foreground">No transactions found matching your search criteria.</p>
                        ) : (
                          <p className="text-muted-foreground">No transactions recorded yet. Create your first transaction.</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update the details for this transaction.
              </DialogDescription>
            </DialogHeader>
            {editingTransaction && (
              <TransactionForm
                transaction={editingTransaction}
                locations={locations}
                onSuccess={closeEditDialog}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Process Refund
              </DialogTitle>
              <DialogDescription>
                Mark earmuffs as returned and process the deposit refund.
              </DialogDescription>
            </DialogHeader>
            
            {refundTransaction && !confirmStep && (
              <div className="space-y-6 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Borrower</span>
                    <span className="font-medium">{refundTransaction.borrowerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Original Deposit</span>
                    <span className="font-bold text-lg">${refundTransaction.depositAmount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="full-refund" className="flex flex-col gap-1">
                    <span>Full Refund</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Refund the entire deposit amount
                    </span>
                  </Label>
                  <Switch
                    id="full-refund"
                    checked={isFullRefund}
                    onCheckedChange={(checked) => {
                      setIsFullRefund(checked);
                      if (checked) {
                        setRefundAmount(refundTransaction.depositAmount?.toString() || "0");
                      }
                    }}
                  />
                </div>

                {!isFullRefund && (
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">Refund Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="refund-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={refundTransaction.depositAmount || 0}
                        placeholder="Enter refund amount"
                        className="pl-9"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max refund: ${refundTransaction.depositAmount}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="refund-notes">Notes (Optional)</Label>
                  <Textarea
                    id="refund-notes"
                    placeholder="Reason for refund amount, condition of returned item, etc."
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {refundTransaction && confirmStep && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Confirm Refund Details</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Borrower</span>
                    <span className="font-medium">{refundTransaction.borrowerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Original Deposit</span>
                    <span>${refundTransaction.depositAmount}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Refund Amount</span>
                    <span className="font-bold text-lg text-green-600">
                      ${isFullRefund ? refundTransaction.depositAmount : refundAmount}
                    </span>
                  </div>
                  {!isFullRefund && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Retained</span>
                      <span className="text-amber-600">
                        ${((refundTransaction.depositAmount || 0) - parseFloat(refundAmount || "0")).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {refundNotes && (
                    <div className="border-t pt-2">
                      <span className="text-sm text-muted-foreground">Notes:</span>
                      <p className="text-sm mt-1">{refundNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {!confirmStep ? (
                <>
                  <Button variant="outline" onClick={closeRefundDialog}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setConfirmStep(true)}
                    disabled={!isFullRefund && (!refundAmount || parseFloat(refundAmount) < 0)}
                  >
                    Review Refund
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setConfirmStep(false)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleProcessRefund}
                    disabled={markReturnedMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {markReturnedMutation.isPending ? "Processing..." : "Confirm & Process Refund"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
