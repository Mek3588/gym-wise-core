import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function ProfileDropdown() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      // Check for dummy session first
      const dummySession = localStorage.getItem('dummy-session');
      if (dummySession) {
        const parsedSession = JSON.parse(dummySession);
        setUser(parsedSession.user);
        setProfile({
          first_name: parsedSession.user.user_metadata.first_name,
          last_name: parsedSession.user.user_metadata.last_name,
          role: parsedSession.user.user_metadata.role
        });
        return;
      }

      // Fallback to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle Supabase auth if no dummy session
      const dummySession = localStorage.getItem('dummy-session');
      if (!dummySession) {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          navigate("/auth");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    // Clear dummy session if it exists
    const dummySession = localStorage.getItem('dummy-session');
    if (dummySession) {
      localStorage.removeItem('dummy-session');
      navigate("/auth");
      return;
    }
    
    // Otherwise use Supabase signout
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || "User";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_image_url} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium truncate max-w-32">{getDisplayName()}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role || "Member"}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
