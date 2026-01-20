import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Lock } from "lucide-react";
import { Link } from "wouter";

export default function OperatorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [locationCode, setLocationCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationCode.trim() || !pin.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both location code and PIN",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/operator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locationCode: locationCode.trim(), pin: pin.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store location in localStorage for persistence
      localStorage.setItem("operatorLocation", JSON.stringify(data.location));
      
      toast({
        title: "Welcome!",
        description: `Logged in to ${data.location.name}`,
      });

      // Redirect to operator dashboard
      setLocation("/operator/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid location code or PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Operator Login</CardTitle>
          <CardDescription>
            Enter your location code and PIN to access the operator dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationCode">Location Code</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="locationCode"
                  placeholder="e.g., LA-PICO"
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value.toUpperCase())}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need a location code?</p>
            <p className="mt-1">
              <Link href="/apply" className="text-primary hover:underline">
                Apply to become a gemach operator
              </Link>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
            <Link href="/auth" className="text-primary hover:underline">
              Admin login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
