import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";
import { Location } from "@shared/schema";

interface OperatorAuthContextType {
  operatorLocation: Location | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshLocation: () => void;
}

const OperatorAuthContext = createContext<OperatorAuthContextType | null>(null);

export function OperatorAuthProvider({ children }: { children: ReactNode }) {
  const [operatorLocation, setOperatorLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setPath] = useLocation();

  const loadLocation = () => {
    try {
      const stored = localStorage.getItem("operatorLocation");
      if (stored) {
        const location = JSON.parse(stored);
        setOperatorLocation(location);
      } else {
        setOperatorLocation(null);
      }
    } catch {
      setOperatorLocation(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLocation();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/operator/logout", { 
        method: "POST", 
        credentials: "include" 
      });
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem("operatorLocation");
    setOperatorLocation(null);
    setPath("/auth");
  };

  const refreshLocation = () => {
    loadLocation();
  };

  return (
    <OperatorAuthContext.Provider value={{ operatorLocation, isLoading, logout, refreshLocation }}>
      {children}
    </OperatorAuthContext.Provider>
  );
}

export function useOperatorAuth() {
  const context = useContext(OperatorAuthContext);
  if (!context) {
    throw new Error("useOperatorAuth must be used within an OperatorAuthProvider");
  }
  return context;
}
