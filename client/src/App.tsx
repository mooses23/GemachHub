import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Locations from "@/pages/locations";
import Apply from "@/pages/apply";
import Contact from "@/pages/contact";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLocations from "@/pages/admin/locations";
import AdminTransactions from "@/pages/admin/transactions";
import AdminApplications from "@/pages/admin/applications";
import { Layout } from "@/components/layout/layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/locations" component={Locations} />
        <Route path="/apply" component={Apply} />
        <Route path="/contact" component={Contact} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/locations" component={AdminLocations} />
        <Route path="/admin/transactions" component={AdminTransactions} />
        <Route path="/admin/applications" component={AdminApplications} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
