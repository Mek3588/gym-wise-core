import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/staff": "Staff Management",
  "/plans": "Membership Plans",
  "/attendance": "Attendance",
  "/schedules": "Workout Schedules",
  "/payments": "Payments",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function AppLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      // First check for dummy session
      const dummySession = localStorage.getItem('dummy-session');
      if (dummySession) {
        const parsedSession = JSON.parse(dummySession);
        setUser(parsedSession.user);
        setIsLoading(false);
        return;
      }

      // Fallback to Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes (Supabase only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update if no dummy session exists
      const dummySession = localStorage.getItem('dummy-session');
      if (!dummySession) {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentTitle = pageTitles[location.pathname] || "FitTracker";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopNavbar title={currentTitle} />
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}