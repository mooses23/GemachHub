import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOperatorAuth } from "@/hooks/use-operator-auth";

// Form validation schema
const transactionFormSchema = z.object({
  borrowerName: z.string().min(1, "Name is required"),
  borrowerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  borrowerPhone: z.string().min(10, "Please enter a valid phone number"),
  expectedReturnDate: z.string().min(1, "Expected return date is required"),
  depositAmount: z.number().min(1, "Deposit amount must be at least $1").default(20),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function OperatorTransactionForm() {
  const { toast } = useToast();
  const { operatorLocation } = useOperatorAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Form setup
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      borrowerName: "",
      borrowerEmail: "",
      borrowerPhone: "",
      expectedReturnDate: "",
      depositAmount: 20,
      notes: "",
    },
  });

  // Transaction creation mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      if (!operatorLocation?.id) {
        throw new Error("No location associated with your account");
      }

      const transactionData = {
        locationId: operatorLocation.id,
        borrowerName: data.borrowerName,
        borrowerEmail: data.borrowerEmail || undefined,
        borrowerPhone: data.borrowerPhone,
        depositAmount: data.depositAmount,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate).toISOString() : undefined,
        notes: data.notes || undefined,
      };
      
      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction recorded successfully",
        description: "The borrower's deposit has been recorded in the system.",
      });
      form.reset();
      setIsOpen(false);
      // Refresh the transactions list
      queryClient.invalidateQueries({ queryKey: ["/api/locations", operatorLocation?.id, "transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: TransactionFormValues) {
    createTransactionMutation.mutate(values);
  }

  // Get default return date (5 days from today)
  const getDefaultReturnDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record New Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record New Earmuff Deposit</DialogTitle>
          <DialogDescription>
            Record when a borrower pays their deposit and takes earmuffs from your location.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="borrowerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower's Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter borrower's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="borrowerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        step="0.01"
                        placeholder="20.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 20)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="borrowerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="borrower@example.com (optional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedReturnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Return Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      {...field}
                      placeholder={getDefaultReturnDate()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Any special arrangements or notes" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Recording...
                  </>
                ) : (
                  "Record Deposit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}