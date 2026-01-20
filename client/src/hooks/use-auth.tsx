import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, loginSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Login data type
export type LoginData = z.infer<typeof loginSchema>;

// Registration data type
export type RegisterData = {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  inviteCode: string;
  role?: string;
  locationId?: number;
};

// Auth context type
type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  isOperator: boolean;
  isAdmin: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, RegisterData>;
};

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Query user data
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<Omit<User, "password"> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Ensure user is not undefined
  const user = userData || null;

  // Check if user is an operator
  const isOperator = Boolean(user && (user.role === "operator" || user.isAdmin));
  
  // Check if user is an admin
  const isAdmin = Boolean(user && user.isAdmin);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: Omit<User, "password">) => {
      // Set the user data and invalidate to ensure session is established
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate to refetch and confirm session is working
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: async (user: Omit<User, "password">) => {
      // Set the user data and invalidate to ensure session is established
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate to refetch and confirm session is working
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOperator,
        isAdmin,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}