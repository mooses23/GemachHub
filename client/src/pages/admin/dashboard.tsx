import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Location, Transaction, GemachApplication, Contact } from "@/lib/types";
import { 
  Users, MapPin, FileText, Package, Settings, Grid, List, 
  DollarSign, RefreshCw, AlarmClock, CreditCard, CheckCircle, BarChart3
} from "lucide-react";
import { Link } from "wouter";

type ViewMode = 'grid' | 'list' | 'compact';
type DashboardSection = 'overview' | 'locations' | 'transactions' | 'applications' | 'analytics';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: applications = [] } = useQuery<GemachApplication[]>({
    queryKey: ["/api/applications"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contact"],
  });

  const pendingApplications = applications.filter(app => app.status === "pending").length;
  const activeLocations = locations.filter(loc => loc.isActive).length;
  const pendingReturns = transactions.filter(tx => !tx.isReturned).length;
  const unreadContacts = contacts.filter(c => !c.isRead).length;
  const depositTotal = transactions.reduce((acc, tx) => acc + tx.depositAmount, 0);

  const StatsCard = ({ title, value, subtitle, icon: Icon, className = "" }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    className?: string;
  }) => (
    <Card className={className}>
      <CardContent className={viewMode === 'compact' ? 'p-4' : 'pt-6'}>
        <div className={`flex items-center ${viewMode === 'list' ? 'justify-start gap-4' : 'justify-between'}`}>
          <div>
            <p className={`text-sm text-muted-foreground ${viewMode === 'compact' ? 'text-xs' : ''}`}>
              {title}
            </p>
            <p className={`font-bold ${viewMode === 'compact' ? 'text-lg' : 'text-2xl'}`}>
              {value}
            </p>
          </div>
          <div className={`p-2 bg-primary/10 rounded-full ${viewMode === 'compact' ? 'p-1' : ''}`}>
            <Icon className={`text-primary ${viewMode === 'compact' ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
        </div>
        <p className={`text-xs text-muted-foreground mt-2 ${viewMode === 'compact' ? 'text-[10px]' : ''}`}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          
          {/* View Controls */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  View Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dashboard Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewMode('grid')}>
                  <Grid className="h-4 w-4 mr-2" />
                  Grid View
                  {viewMode === 'grid' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4 mr-2" />
                  List View
                  {viewMode === 'list' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('compact')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compact View
                  {viewMode === 'compact' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Section Navigation */}
        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as DashboardSection)} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Stats Cards - Responsive based on view mode */}
            <div className={`gap-6 mb-8 ${
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
              viewMode === 'list' ? 'space-y-4' :
              'grid grid-cols-2 lg:grid-cols-6'
            }`}>
              <StatsCard
                title="Total Locations"
                value={locations.length}
                subtitle={`${activeLocations} active locations`}
                icon={MapPin}
              />
              
              <StatsCard
                title="Deposits Held"
                value={`$${depositTotal}`}
                subtitle={`${pendingReturns} pending returns`}
                icon={DollarSign}
              />
              
              <StatsCard
                title="New Applications"
                value={pendingApplications}
                subtitle="Waiting for review"
                icon={FileText}
              />
              
              <StatsCard
                title="Unread Messages"
                value={unreadContacts}
                subtitle="Requires attention"
                icon={AlarmClock}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/locations">
                    <Button className="w-full" variant="outline">
                      Manage Locations
                    </Button>
                  </Link>
                  <Link href="/admin/transactions">
                    <Button className="w-full" variant="outline">
                      View Transactions
                    </Button>
                  </Link>
                  <Link href="/admin/applications">
                    <Button className="w-full" variant="outline">
                      Review Applications
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlarmClock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">Latest Transaction</p>
                      <p className="text-muted-foreground">
                        {transactions.length > 0 ? 'Recent deposit processed' : 'No recent activity'}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">New Applications</p>
                      <p className="text-muted-foreground">
                        {pendingApplications} pending review
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Payment Processing</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Location Network</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p>Manage all Gemach locations across regions</p>
                    <Link href="/admin/locations">
                      <Button>View All Locations</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{locations.length}</p>
                      <p className="text-sm text-muted-foreground">Total Locations</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{activeLocations}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{locations.length - activeLocations}</p>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p>Monitor deposits and returns across all locations</p>
                    <Link href="/admin/transactions">
                      <Button>View All Transactions</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">${depositTotal}</p>
                      <p className="text-sm text-muted-foreground">Total Deposits</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{pendingReturns}</p>
                      <p className="text-sm text-muted-foreground">Pending Returns</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{transactions.filter(tx => tx.isReturned).length}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Application Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p>Review and approve new Gemach applications</p>
                    <Link href="/admin/applications">
                      <Button>Review Applications</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{applications.length}</p>
                      <p className="text-sm text-muted-foreground">Total Applications</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{pendingApplications}</p>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{applications.filter(app => app.status === "approved").length}</p>
                      <p className="text-sm text-muted-foreground">Approved</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>Comprehensive analytics and reporting for your Gemach operations</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Usage Statistics</h3>
                      <p className="text-sm text-muted-foreground">Track location performance and user engagement</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Financial Reports</h3>
                      <p className="text-sm text-muted-foreground">Monitor deposits, returns, and payment methods</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Regional Analysis</h3>
                      <p className="text-sm text-muted-foreground">Compare performance across different regions</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Growth Metrics</h3>
                      <p className="text-sm text-muted-foreground">Track expansion and user adoption rates</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}