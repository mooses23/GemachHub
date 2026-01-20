import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getGemachApplications, updateGemachApplicationStatus, approveApplicationWithLocation } from "@/lib/api";
import { GemachApplication, Region, InsertLocation, insertLocationSchema } from "@shared/schema";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search, 
  MoreVertical,
  Check,
  X,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Home,
  Plus,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const locationFormSchema = insertLocationSchema.omit({ locationCode: true }).extend({
  name: z.string().min(1, "Location name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  regionId: z.number().min(1, "Region is required"),
});

type LocationFormData = z.infer<typeof locationFormSchema>;

export default function AdminApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewApplication, setViewApplication] = useState<GemachApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [approveApplication, setApproveApplication] = useState<GemachApplication | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(null);
  const [isInviteCodeDialogOpen, setIsInviteCodeDialogOpen] = useState(false);

  const { data: applications = [] } = useQuery<GemachApplication[]>({
    queryKey: ["/api/applications"],
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      address: "",
      zipCode: "",
      phone: "",
      email: "",
      regionId: 1,
      isActive: true,
      inventoryCount: 0,
      cashOnly: false,
      depositAmount: 20,
      paymentMethods: ["cash"],
      processingFeePercent: 300,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      updateGemachApplicationStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsViewDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const approveWithLocationMutation = useMutation({
    mutationFn: ({ id, locationData }: { id: number; locationData: InsertLocation }) => 
      approveApplicationWithLocation(id, locationData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsApproveDialogOpen(false);
      setApproveApplication(null);
      form.reset();
      
      // Show invite code dialog
      if (data.inviteCode) {
        setGeneratedInviteCode(data.inviteCode);
        setIsInviteCodeDialogOpen(true);
      } else {
        toast({
          title: "Application Approved",
          description: "Application has been approved and new location has been created successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve application: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleViewApplication = (application: GemachApplication) => {
    setViewApplication(application);
    setIsViewDialogOpen(true);
  };

  const handleStartApproval = (application: GemachApplication) => {
    setApproveApplication(application);
    form.reset({
      name: `${application.firstName} ${application.lastName}'s Gemach`,
      contactPerson: `${application.firstName} ${application.lastName}`,
      address: application.location,
      zipCode: "",
      phone: application.phone,
      email: application.email,
      regionId: 1,
      isActive: true,
      inventoryCount: 0,
      cashOnly: false,
      depositAmount: 20,
      paymentMethods: ["cash"],
      processingFeePercent: 300,
    });
    setIsApproveDialogOpen(true);
  };

  const onSubmitApproval = (data: LocationFormData) => {
    if (!approveApplication) return;
    
    approveWithLocationMutation.mutate({ 
      id: approveApplication.id, 
      locationData: data as InsertLocation
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredApplications = applications.filter(application => {
    if (filterStatus !== "all" && application.status !== filterStatus) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      application.firstName.toLowerCase().includes(searchLower) ||
      application.lastName.toLowerCase().includes(searchLower) ||
      application.email.toLowerCase().includes(searchLower) ||
      application.location.toLowerCase().includes(searchLower)
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
            <h1 className="text-3xl font-bold">Gemach Applications</h1>
            <p className="text-muted-foreground">Review and manage applications to open new gemach locations</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Review and manage applications from volunteers wanting to open new gemach locations
            </CardDescription>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
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
                  variant={filterStatus === "pending" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending
                </Button>
                <Button 
                  variant={filterStatus === "approved" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("approved")}
                >
                  Approved
                </Button>
                <Button 
                  variant={filterStatus === "rejected" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className="font-medium">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {application.email}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {application.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {application.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(application.submittedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(application.submittedAt), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
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
                              <DropdownMenuItem onClick={() => handleViewApplication(application)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {application.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStartApproval(application)}>
                                    <Plus className="mr-2 h-4 w-4 text-green-600" />
                                    Approve & Create Location
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(application.id)}>
                                    <X className="mr-2 h-4 w-4 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchTerm || filterStatus !== "all" ? (
                          <p className="text-muted-foreground">No applications found matching your criteria.</p>
                        ) : (
                          <p className="text-muted-foreground">No applications submitted yet.</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Application Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review the complete application information
              </DialogDescription>
            </DialogHeader>
            {viewApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">First Name</h3>
                    <p>{viewApplication.firstName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Name</h3>
                    <p>{viewApplication.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{viewApplication.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{viewApplication.phone}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p>{viewApplication.location}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Message</h3>
                  <Textarea 
                    value={viewApplication.message || "No message provided"} 
                    readOnly 
                    className="h-24 mt-1"
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{getStatusBadge(viewApplication.status)}</div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  {viewApplication.status === "pending" && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReject(viewApplication.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleStartApproval(viewApplication);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Approve & Create Location
                      </Button>
                    </>
                  )}
                  {viewApplication.status !== "pending" && (
                    <Button onClick={() => setIsViewDialogOpen(false)}>
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Application & Create Location Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Approve Application & Create Location</DialogTitle>
              <DialogDescription>
                Fill in the location details to approve this application and create a new gemach location.
              </DialogDescription>
            </DialogHeader>
            {approveApplication && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Applicant Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {approveApplication.firstName} {approveApplication.lastName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {approveApplication.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {approveApplication.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>{" "}
                      {approveApplication.location}
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitApproval)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Brooklyn Baby Banz Gemach" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="regionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id.toString()}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Street, City, State, Country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ""} />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Amount ($)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                value={field.value ?? 20}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inventoryCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Inventory</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => {
                          setIsApproveDialogOpen(false);
                          setApproveApplication(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={approveWithLocationMutation.isPending}
                      >
                        {approveWithLocationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Location...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Approve & Create Location
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invite Code Success Dialog */}
        <Dialog open={isInviteCodeDialogOpen} onOpenChange={setIsInviteCodeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Application Approved
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The application has been approved and a new location has been created. 
                Share this invite code with the new operator so they can create their account:
              </p>
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{generatedInviteCode}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                This code can only be used once. The new operator will use this code when registering 
                to automatically be assigned to their location.
              </p>
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    if (generatedInviteCode) {
                      navigator.clipboard.writeText(generatedInviteCode);
                      toast({
                        title: "Copied!",
                        description: "Invite code copied to clipboard.",
                      });
                    }
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  Copy Code
                </Button>
                <Button onClick={() => setIsInviteCodeDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
