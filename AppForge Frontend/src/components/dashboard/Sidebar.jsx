import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronLeft, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { mainNav, secondaryNav } from "@/components/dashboard/navItems";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavItem = ({ item }) => {
    const active = location.pathname === item.path;
    return (
      <Link to={item.path}>
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
            active
              ? "bg-[#4F7CFF]/10 text-[#4F7CFF]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#4F7CFF] rounded-full"
            />
          )}
          <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[#4F7CFF]" : ""}`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      className="hidden md:flex h-screen sticky top-0 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex-col z-40"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 dark:border-gray-800">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-base font-bold tracking-tight"
              >
                AppForge
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-6 h-6 rounded-md bg-accent items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNav.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}

        <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />

        {secondaryNav.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => base44.auth.logout("/")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-all w-full"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}