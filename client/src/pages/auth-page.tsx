import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Home, MapPin, Lock, Loader2 } from "lucide-react";

function OperatorLoginForm() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [locationCode, setLocationCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationCode.trim() || !pin.trim()) {
      toast({
        title: t("missingInformation"),
        description: t("pleaseEnterCodeAndPin"),
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

      localStorage.setItem("operatorLocation", JSON.stringify(data.location));

      toast({
        title: t("welcomeToast"),
        description: t("loggedInToLocation").replace("{location}", language === "he" && data.location.nameHe ? data.location.nameHe : data.location.name),
      });

      window.location.href = "/operator/dashboard";
    } catch (error) {
      toast({
        title: t("loginFailed"),
        description: error instanceof Error ? error.message : t("invalidCodeOrPin"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{t("operatorLogin")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("operatorLoginDescription")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="locationCode">{t("locationCode")}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="locationCode"
              placeholder={t("locationCodeExamplePlaceholder")}
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
              placeholder={t("enterPasswordPlaceholder")}
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
    </div>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("operator");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      if (user.role === "operator") {
        setLocation("/operator");
      } else if (user.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          {t("backToHome")}
        </Button>
      </div>

      <div className="flex-1 flex">
        <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-12 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Baby Banz Earmuffs Gemach</h1>
                <p className="text-muted-foreground">
                  {t("welcomeToGemachSystem")}
                </p>
              </div>

              <Tabs
                defaultValue="operator"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="operator">{t("operatorTab")}</TabsTrigger>
                  <TabsTrigger value="admin">{t("adminTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="operator" className="py-6">
                  <OperatorLoginForm />
                </TabsContent>
                <TabsContent value="admin" className="py-6">
                  <LoginForm />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12">
          <div className="max-w-lg space-y-8 text-white">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">{t("protectingLittleEars")}</h2>
              <p className="text-lg opacity-90">
                {t("protectingLittleEarsDesc")}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">{t("forGemachOperators")}</h3>
              <p className="opacity-90">
                {t("operatorAccessDescription")}
              </p>
              <ul className="list-disc list-inside space-y-2 opacity-90">
                <li>{t("trackEarmuffInventory")}</li>
                <li>{t("manageBorrowerDeposits")}</li>
                <li>{t("processReturnsAndRefunds")}</li>
                <li>{t("viewTransactionHistory")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
