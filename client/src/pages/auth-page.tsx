import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to homepage if already logged in
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
      <div className="flex-1 flex">
        {/* Left column - Auth forms */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-12 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Baby Banz Earmuffs Gemach</h1>
                <p className="text-muted-foreground">
                  Welcome to our gemach management system
                </p>
              </div>

              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="py-6">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register" className="py-6">
                  <RegisterForm />
                </TabsContent>
              </Tabs>

              <div className="text-center text-sm text-muted-foreground">
                {activeTab === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => setActiveTab("register")}
                    >
                      Register here
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Log in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Hero section */}
        <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12">
          <div className="max-w-lg space-y-8 text-white">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Protecting Little Ears</h2>
              <p className="text-lg opacity-90">
                Our gemach provides Baby Banz earmuffs to protect infants from harmful noise levels at events, parties, and gatherings.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">For Gemach Operators</h3>
              <p className="opacity-90">
                If you are a gemach operator, please contact the administrator to get your operator account. With an operator account, you can:
              </p>
              <ul className="list-disc list-inside space-y-2 opacity-90">
                <li>Track earmuff inventory</li>
                <li>Manage borrower deposits</li>
                <li>Process returns and deposit refunds</li>
                <li>View sanitization logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}