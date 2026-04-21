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
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { Location } from "@shared/schema";

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
  const { t, language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

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

  const createTransactionMutation = useMutation({
    mutationFn: async (data: BorrowFormValues) => {
      const transactionData = {
        locationId: parseInt(data.locationId),
        borrowerName: data.borrowerName,
        borrowerEmail: data.borrowerEmail || undefined,
        borrowerPhone: data.borrowerPhone,
        depositAmount: 20,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate).toISOString() : undefined,
        notes: data.notes || undefined,
      };

      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return await res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: t("depositRecordedSuccess"),
        description: t("depositRecordedSuccessLong"),
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("errorRecordingDeposit"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
              <h3 className="text-xl font-semibold text-green-700">{t("depositRecordedSuccess")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("depositRecordedSuccessDesc")}
              </p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              {t("recordAnotherDeposit")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("borrowEarmuffsTitle")}</CardTitle>
        <CardDescription>
          {t("borrowFormDescription")}
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
                  <FormLabel>{t("gemachLocation")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectLocationBorrowingFrom")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationsLoading ? (
                        <SelectItem value="loading" disabled>{t("loadingLocations")}</SelectItem>
                      ) : (
                        locations
                          .filter(location => location.isActive)
                          .map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {language === "he" && location.nameHe ? location.nameHe : location.name} - {language === "he" && location.contactPersonHe ? location.contactPersonHe : location.contactPerson}
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
                    <FormLabel>{t("yourFullName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("yourFullName")} {...field} />
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
                    <FormLabel>{t("phoneNumber")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("phonePlaceholder")} {...field} />
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
                  <FormLabel>{t("emailOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailOptionalPlaceholder")}
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
                  <FormLabel>{t("expectedReturnDate")}</FormLabel>
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
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("notesPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">{t("importantInformation")}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t("deposit20Required")}</li>
                <li>• {t("depositRefundedGoodCondition")}</li>
                <li>• {t("earmuffsSanitized")}</li>
                <li>• {t("pleaseReturnByDate")}</li>
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
                  {t("recordingDeposit")}
                </>
              ) : (
                t("recordDeposit20")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
