import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, LogOut, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { mainNav, secondaryNav } from "@/components/dashboard/navItems";

/**
 * Mobile navigation drawer.
 *
 * Always mounted; visibility is driven entirely by the `open` prop via CSS
 * classes (opacity + translate-x). This avoids framer-motion AnimatePresence
 * exit-animation pitfalls (unkeyed children failing to unmount), so the drawer
 * DOM always reflects the current `open` state.
 *
 * Close paths:
 *  - menu item tap   -> Link onClick={onClose} + layout route-change effect
 *  - X button       -> onClick={onClose}
 *  - backdrop tap    -> onClick={onClose}
 *  - Android back    -> history sentinel + popstate listener
 */
export default function MobileDrawer({ open, onClose }) {
  const location = useLocation();
  const items = [...mainNav, ...secondaryNav];

  // Lock background scroll and intercept the Android back button while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.history.pushState({ drawer: true }, "");
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.body.style.overflow = "";
      // Pop the sentinel we pushed if it's still the current entry.
      if (window.history.state && window.history.state.drawer) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <aside
        className={`absolute top-0 left-0 bottom-0 w-[280px] max-w-[80vw] bg-white dark:bg-gray-950 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">AppForge</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={onClose}>
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#4F7CFF]/10 text-[#4F7CFF]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}