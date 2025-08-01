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
    <header className="h-16 border-b border-border bg-background px-3 sm:px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <SidebarTrigger />
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown />

        <ProfileDropdown />
      </div>
    </header>
  );
}