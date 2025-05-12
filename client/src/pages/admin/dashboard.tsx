import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getTransactions, getGemachApplications, getContacts } from "@/lib/api";
import { 
  Users, MapPin, FileText, Package,
  DollarSign, RefreshCw, AlarmClock
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contact"],
  });

  const pendingApplications = applications.filter(app => app.status === "pending").length;
  const activeLocations = locations.filter(loc => loc.isActive).length;
  const pendingReturns = transactions.filter(tx => !tx.isReturned).length;
  const unreadContacts = contacts.filter(c => !c.isRead).length;
  const depositTotal = transactions.reduce((acc, tx) => acc + tx.depositAmount, 0);

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Locations</p>
                  <p className="text-2xl font-bold">{locations.length}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeLocations} active locations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deposits Held</p>
                  <p className="text-2xl font-bold">${depositTotal}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {pendingReturns} pending returns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Applications</p>
                  <p className="text-2xl font-bold">{pendingApplications}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Waiting for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                  <p className="text-2xl font-bold">{unreadContacts}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <AlarmClock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From contact form
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent">
          <TabsList className="mb-6">
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Borrower</th>
                          <th className="text-left py-2">Location</th>
                          <th className="text-left py-2">Deposit</th>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map((tx) => {
                          const location = locations.find(l => l.id === tx.locationId);
                          return (
                            <tr key={tx.id} className="border-b">
                              <td className="py-2">{tx.borrowerName}</td>
                              <td className="py-2">{location?.name || "Unknown"}</td>
                              <td className="py-2">${tx.depositAmount}</td>
                              <td className="py-2">{new Date(tx.borrowDate).toLocaleDateString()}</td>
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${tx.isReturned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {tx.isReturned ? 'Returned' : 'Borrowed'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No transactions yet</p>
                )}
                
                <div className="mt-4">
                  <Link href="/admin/transactions" className="text-primary hover:underline text-sm">
                    View all transactions
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>New Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Location</th>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.slice(0, 5).map((app) => (
                          <tr key={app.id} className="border-b">
                            <td className="py-2">{app.firstName} {app.lastName}</td>
                            <td className="py-2">{app.location}</td>
                            <td className="py-2">{new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No applications yet</p>
                )}
                
                <div className="mt-4">
                  <Link href="/admin/applications" className="text-primary hover:underline text-sm">
                    View all applications
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/admin/locations" className="flex items-center p-4 border rounded-md hover:bg-gray-50 transition-colors">
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      <span>Manage Locations</span>
                    </Link>
                    <Link href="/admin/transactions" className="flex items-center p-4 border rounded-md hover:bg-gray-50 transition-colors">
                      <RefreshCw className="h-5 w-5 mr-3 text-primary" />
                      <span>Track Transactions</span>
                    </Link>
                    <Link href="/admin/applications" className="flex items-center p-4 border rounded-md hover:bg-gray-50 transition-colors">
                      <FileText className="h-5 w-5 mr-3 text-primary" />
                      <span>Review Applications</span>
                    </Link>
                    <Link href="/" className="flex items-center p-4 border rounded-md hover:bg-gray-50 transition-colors">
                      <Package className="h-5 w-5 mr-3 text-primary" />
                      <span>View Public Site</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>By The Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Earmuffs:</span>
                      <span className="font-medium">{locations.reduce((acc, loc) => acc + loc.inventoryCount, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Loans:</span>
                      <span className="font-medium">{pendingReturns}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Deposits Held:</span>
                      <span className="font-medium">${depositTotal}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Regions:</span>
                      <span className="font-medium">
                        {new Set(locations.map(loc => loc.regionId)).size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
