import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated (dummy session)
    const dummySession = localStorage.getItem('dummy-session');
    if (dummySession) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Dumbbell className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold">FitTracker</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Transform Your Gym Management</h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-md">
              Streamline your fitness business with powerful tools for member management, 
              payment tracking, and comprehensive reporting.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Member & Staff Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Payment Processing & Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Schedule & Class Management</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="text-center lg:hidden">
            <div className="flex justify-center mb-4">
              <div className="bg-primary rounded-full p-3">
                <Dumbbell className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">FitTracker</h1>
            <p className="text-muted-foreground mt-2">Gym Management System</p>
          </div>
          
          <AuthForm mode={mode} onToggleMode={toggleMode} />
        </div>
      </div>
    </div>
  );
}