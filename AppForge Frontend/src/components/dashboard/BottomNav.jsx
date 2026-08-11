import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Smartphone, PlusCircle, Download, Bell } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/my-apps", label: "Apps", icon: Smartphone },
  { to: "/new-project", label: "Create", icon: PlusCircle, primary: true },
  { to: "/downloads", label: "Files", icon: Download },
  { to: "/notifications", label: "Alerts", icon: Bell },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.to;
          if (item.primary) {
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center justify-center -mt-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shadow-lg shadow-[#4F7CFF]/30">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full pt-1.5 ${active ? "text-[#4F7CFF]" : "text-muted-foreground"}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}