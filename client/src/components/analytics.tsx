import { useEffect } from "react";
import { useLocation } from "wouter";

export function Analytics() {
  const [location] = useLocation();

  useEffect(() => {
    // This function would normally integrate with a real analytics provider
    // For this implementation, we'll just log page views to console
    const logPageView = (path: string) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Analytics: Page view - ${path}`);
      }
      // In a real implementation, you would call your analytics service here
      // Example: window.gtag('config', 'GA-ID', { page_path: path });
    };

    // Log the page view whenever location changes
    logPageView(location);
  }, [location]);

  return null; // This component doesn't render anything
}
