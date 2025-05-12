import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Import the wouter Route props
import type { RouteComponentProps } from "wouter";

// Props for the ProtectedRoute component
interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<RouteComponentProps>;
  requiredRole?: "user" | "operator" | "admin";
}

// Protected route component that checks authentication and redirects if needed
export function ProtectedRoute({
  path,
  component: Component,
  requiredRole = "user",
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isOperator } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check role permissions
  const hasPermission = 
    isAdmin || // Admin can access everything
    (requiredRole === "operator" && isOperator) || // Operator can access operator routes
    requiredRole === "user"; // Any authenticated user can access user routes

  // Redirect to home page if not authorized
  if (!hasPermission) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Render the protected component
  return <Route path={path} component={Component} />;
}