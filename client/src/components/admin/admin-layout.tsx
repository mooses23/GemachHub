import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminNavTabs } from "./admin-nav-tabs";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ["/api/transactions"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/locations"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/applications"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/payment-methods"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/disputes/summary"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/system/status"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/inbox/counts"], staleTime: 30_000 });
    queryClient.prefetchQuery({ queryKey: ["/api/admin/emails/status"], staleTime: 30_000 });

    // Warm sibling admin route chunks so tab navigation feels instant.
    void import("@/pages/admin/dashboard");
    void import("@/pages/admin/locations");
    void import("@/pages/admin/transactions");
    void import("@/pages/admin/inbox");
    void import("@/pages/admin/applications");
  }, []);

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <AdminNavTabs />
        {children}
      </div>
    </div>
  );
}
