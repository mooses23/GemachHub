import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Location } from "@shared/schema";

// Form validation schema
const borrowFormSchema = z.object({
  locationId: z.string().min(1, "Please select a location"),
  borrowerName: z.string().min(1, "Name is required"),
  borrowerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  borrowerPhone: z.string().min(10, "Please enter a valid phone number"),
  expectedReturnDate: z.string().min(1, "Expected return date is required"),
  notes: z.string().optional(),
});

type BorrowFormValues = z.infer<typeof borrowFormSchema>;

export function BorrowForm() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch locations for the dropdown
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Form setup
  const form = useForm<BorrowFormValues>({
    resolver: zodResolver(borrowFormSchema),
    defaultValues: {
      locationId: "",
      borrowerName: "",
      borrowerEmail: "",
      borrowerPhone: "",
      expectedReturnDate: "",
      notes: "",
    },
  });

  // Transaction creation mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: BorrowFormValues) => {
      const transactionData = {
        locationId: parseInt(data.locationId),
        borrowerName: data.borrowerName,
        borrowerEmail: data.borrowerEmail || null,
        borrowerPhone: data.borrowerPhone,
        depositAmount: 20, // Standard $20 deposit
        expectedReturnDate: new Date(data.expectedReturnDate),
        notes: data.notes || null,
      };
      
      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return await res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Deposit recorded successfully",
        description: "Your $20 deposit has been recorded. Please return the earmuffs by the expected date to receive your refund.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording deposit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: BorrowFormValues) {
    createTransactionMutation.mutate(values);
  }

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-700">Deposit Recorded Successfully!</h3>
              <p className="text-muted-foreground mt-2">
                Your $20 deposit has been recorded. Please keep this confirmation and return the earmuffs by your expected return date.
              </p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              Record Another Deposit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Borrow Baby Banz Earmuffs</CardTitle>
        <CardDescription>
          Please fill out this form to record your $20 deposit when picking up earmuffs from a gemach location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gemach Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the location where you're borrowing from" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationsLoading ? (
                        <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                      ) : (
                        locations
                          .filter(location => location.isActive)
                          .map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name} - {location.contactPerson}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="borrowerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      placeholder="your.email@example.com (optional)" 
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
                      placeholder="Any additional information or special arrangements" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• A $20 deposit is required for all earmuff borrowing</li>
                <li>• Your deposit will be fully refunded when you return the earmuffs in good condition</li>
                <li>• All earmuffs are sanitized between uses with medical-grade cleaning protocols</li>
                <li>• Please return the earmuffs by your expected return date</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Recording Deposit...
                </>
              ) : (
                "Record $20 Deposit"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}