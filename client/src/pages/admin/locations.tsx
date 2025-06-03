import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLocations, getRegions, updateLocation } from "@/lib/api";
import { Region, Location } from "@shared/schema";
import { LocationForm } from "@/components/admin/location-form";
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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLocations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      updateLocation(id, { isActive }),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Location status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const toggleLocationStatus = (id: number, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !isActive });
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingLocation(null);
  };

  const getRegionNameById = (regionId: number) => {
    const region = regions.find(r => r.id === regionId);
    return region ? region.name : "Unknown";
  };

  const filteredLocations = locations.filter(location => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      location.contactPerson.toLowerCase().includes(searchLower) ||
      location.address.toLowerCase().includes(searchLower) ||
      getRegionNameById(location.regionId).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        {/* Navigation Breadcrumbs */}
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
            <h1 className="text-3xl font-bold">Manage Locations</h1>
            <p className="text-muted-foreground">View and manage all gemach locations</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create New Location</DialogTitle>
                  <DialogDescription>
                    Add a new gemach location to the system. Fill out all required information.
                  </DialogDescription>
                </DialogHeader>
                <LocationForm 
                  regions={regions} 
                  onSuccess={() => setIsCreateDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Locations</CardTitle>
            <CardDescription>
              Manage gemach locations and their details
            </CardDescription>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[180px] hidden md:table-cell">Contact Person</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Region</TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell">Inventory</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div>{location.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {location.address}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>{location.contactPerson}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {location.phone}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {location.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getRegionNameById(location.regionId)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{location.inventoryCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(location.isActive)}
                            onCheckedChange={() => toggleLocationStatus(location.id, Boolean(location.isActive))}
                          />
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
                              <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Location
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchTerm ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground">No locations found matching your search.</p>
                            <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-muted-foreground">No locations available. Add your first location.</p>
                            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                              Add Location
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Location Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update the details for this gemach location.
              </DialogDescription>
            </DialogHeader>
            {editingLocation && (
              <LocationForm
                location={editingLocation}
                regions={regions}
                onSuccess={closeEditDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
