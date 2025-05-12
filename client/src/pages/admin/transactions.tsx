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
  AlertCircle 
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

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const markReturnedMutation = useMutation({
    mutationFn: (id: number) => markTransactionReturned(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Earmuffs have been marked as returned and deposit refunded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleMarkReturned = (id: number) => {
    markReturnedMutation.mutate(id);
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

  const filteredTransactions = transactions.filter(transaction => {
    // Apply status filter
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
                            <Badge variant={transaction.isReturned ? "success" : "warning"}>
                              {transaction.isReturned ? "Returned" : "Active"}
                            </Badge>
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
                                  <DropdownMenuItem onClick={() => handleMarkReturned(transaction.id)}>
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
                      <TableCell colSpan={6} className="text-center py-8">
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

        {/* Edit Transaction Dialog */}
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
      </div>
    </div>
  );
}
