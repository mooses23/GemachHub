import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertGemachApplicationSchema } from "@/lib/types";
import type { InsertGemachApplication } from "@/lib/types";
import { CityCategory, Region } from "@shared/schema";
import { submitGemachApplication } from "@/lib/api";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LoaderCircle, CheckCircle2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Extend the schema with additional validation
const formSchema = insertGemachApplicationSchema.extend({
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit an application.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ApplyForm() {
  const { toast } = useToast();
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");

  const { data: cityCategories = [] } = useQuery<CityCategory[]>({
    queryKey: ["/api/city-categories"],
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      community: "",
      message: "",
      terms: false,
    },
  });

  const getRegionName = (regionId: number) => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || "Other";
  };

  const categoriesByRegion = cityCategories.reduce((acc, cat) => {
    const regionName = getRegionName(cat.regionId);
    if (!acc[regionName]) {
      acc[regionName] = [];
    }
    acc[regionName].push(cat);
    return acc;
  }, {} as Record<string, CityCategory[]>);

  const { mutate, isPending, isSuccess, reset } = useMutation({
    mutationFn: (data: InsertGemachApplication) => submitGemachApplication(data),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "We've received your application and will contact you soon.",
      });
      form.reset();
      // Reset form after showing success for 5 seconds
      setTimeout(() => {
        reset();
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit application: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Remove terms field which is not part of the backend schema
    const { terms, ...applicationData } = data;
    mutate(applicationData);
  };

  return (
    <Card className="bg-neutral-100 rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Apply to Open a Gemach</CardTitle>
        <CardDescription>
          Fill out this form to start the process of opening a Baby Banz Earmuffs Gemach in your community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <Alert className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <AlertDescription>
                Your application has been submitted successfully! We'll contact you soon.
              </AlertDescription>
            </div>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Brooklyn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="11201" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="community"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community / Neighborhood (Optional)</FormLabel>
                    {!showNewCommunity ? (
                      <div className="space-y-2">
                        <Select
                          value={selectedCommunity}
                          onValueChange={(value) => {
                            if (value === "__new__") {
                              setShowNewCommunity(true);
                              setSelectedCommunity("");
                              field.onChange("");
                            } else {
                              setSelectedCommunity(value);
                              field.onChange(value);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an existing community or add new" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__new__">
                              <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add New Community
                              </span>
                            </SelectItem>
                            {Object.entries(categoriesByRegion).map(([regionName, categories]) => (
                              <div key={regionName}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                  {regionName}
                                </div>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                            {cityCategories.length === 0 && (
                              <SelectItem value="__new__" disabled>
                                No communities yet - add yours!
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter your community name (e.g., Flatbush, Crown Heights)" 
                            {...field} 
                            value={field.value ?? ""} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowNewCommunity(false);
                            field.onChange("");
                          }}
                        >
                          Back to existing communities
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Select an existing community or add a new one for easier discovery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why would you like to open a gemach?</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4} 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to follow the guidelines for managing a Baby Banz Earmuffs Gemach location.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
