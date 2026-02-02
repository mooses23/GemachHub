import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Loader2, MapPin, Lock } from "lucide-react";
import { Link } from "wouter";

export default function OperatorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [locationCode, setLocationCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationCode.trim() || !pin.trim()) {
      toast({
        title: t("missingInformation"),
        description: t("enterLocationCodeAndPIN"),
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
        title: t("welcome"),
        description: `${t("loggedInTo")} ${data.location.name}`,
      });

      // Redirect to operator dashboard
      setLocation("/operator/dashboard");
    } catch (error) {
      toast({
        title: t("loginFailed"),
        description: error instanceof Error ? error.message : t("invalidLocationCodeOrPIN"),
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
          <CardTitle className="text-2xl">{t("operatorLogin")}</CardTitle>
          <CardDescription>
            {t("operatorLoginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationCode">{t("locationCode")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="locationCode"
                  placeholder={t("locationCodePlaceholder")}
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value.toUpperCase())}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">{t("pin")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder={t("enterYourPIN")}
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
                  {t("loggingIn")}
                </>
              ) : (
                t("login")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>{t("needLocationCode")}</p>
            <p className="mt-1">
              <Link href="/apply" className="text-primary hover:underline">
                {t("applyToBecomeOperator")}
              </Link>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
            <Link href="/auth" className="text-primary hover:underline">
              {t("adminLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
