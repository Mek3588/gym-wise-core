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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { useNotifications } from "@/hooks/useNotifications";

interface TopNavbarProps {
  title: string;
}

export function TopNavbar({ title }: TopNavbarProps) {
  // Initialize notifications
  useNotifications();

  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <SidebarTrigger className="hover:bg-accent/50 transition-colors" />
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full hidden sm:block"></div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationDropdown />
        <div className="w-px h-6 bg-border hidden sm:block"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}