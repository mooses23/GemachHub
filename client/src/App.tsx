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
import Borrow from "@/pages/borrow";
import AuthPage from "@/pages/auth-page";
import SelfDepositPage from "@/pages/self-deposit";
import Rules from "@/pages/rules";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLocations from "@/pages/admin/locations";
import AdminTransactions from "@/pages/admin/transactions";
import AdminApplications from "@/pages/admin/applications";
import OperatorIndex from "@/pages/operator/index";
import OperatorDashboard from "@/pages/operator/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Layout } from "@/components/layout/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/locations" component={Locations} />
        <Route path="/apply" component={Apply} />
        <Route path="/contact" component={Contact} />
        <Route path="/borrow" component={Borrow} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/self-deposit" component={SelfDepositPage} />
        <Route path="/rules" component={Rules} />
        
        {/* Protected Admin Routes */}
        <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
        <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredRole="admin" />
        <ProtectedRoute path="/admin/locations" component={AdminLocations} requiredRole="admin" />
        <ProtectedRoute path="/admin/transactions" component={AdminTransactions} requiredRole="admin" />
        <ProtectedRoute path="/admin/applications" component={AdminApplications} requiredRole="admin" />
        
        {/* Protected Operator Routes */}
        <ProtectedRoute path="/operator" component={OperatorIndex} requiredRole="operator" />
        <ProtectedRoute path="/operator/dashboard" component={OperatorDashboard} requiredRole="operator" />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
