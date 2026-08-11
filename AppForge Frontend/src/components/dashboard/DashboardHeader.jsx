import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Bell, Search, Moon, Sun, Menu, User, Crown, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCurrentPlanId, PLANS } from "@/lib/plans";

export default function DashboardHeader({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";
  const toggleDark = () => setTheme(dark ? "light" : "dark");

  const planId = getCurrentPlanId(user);

  return (
    <header className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-accent text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg" onClick={toggleDark}>
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
          </Button>
        </Link>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-accent transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.[0] || "U"}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-muted-foreground">{PLANS[planId].name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/upgrade-plan")}>
              <Crown className="w-4 h-4 mr-2" /> Upgrade Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[#EF4444]" onClick={() => base44.auth.logout("/")}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}