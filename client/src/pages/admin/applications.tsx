import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGemachApplications, updateGemachApplicationStatus } from "@/lib/api";
import { GemachApplication } from "@shared/schema";
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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Home
} from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function AdminApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewApplication, setViewApplication] = useState<GemachApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: applications = [] } = useQuery<GemachApplication[]>({
    queryKey: ["/api/applications"],
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleViewApplication = (application: GemachApplication) => {
    setViewApplication(application);
    setIsViewDialogOpen(true);
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
    // Apply status filter
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
                                  <DropdownMenuItem onClick={() => handleApprove(application.id)}>
                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                    Approve
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
                        onClick={() => handleApprove(viewApplication.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
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
      </div>
    </div>
  );
}
