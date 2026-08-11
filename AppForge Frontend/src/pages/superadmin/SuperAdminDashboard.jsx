import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/superadmin/audit";
import {
  LayoutDashboard, Users, FolderGit2, Hammer, Receipt, Crown, Bell,
  LifeBuoy, ScrollText, Settings, Shield, LogOut, ChevronRight, Loader2,
  Globe, Tag, CreditCard, History,
} from "lucide-react";

import DashboardOverview from "@/components/superadmin/sections/DashboardOverview";
import UserManagement from "@/components/superadmin/sections/UserManagement";
import ProjectManagement from "@/components/superadmin/sections/ProjectManagement";
import BuildHistorySection from "@/components/superadmin/sections/BuildHistorySection";
import PaymentRequests from "@/components/superadmin/PaymentRequests";
import PlansManagement from "@/components/superadmin/sections/PlansManagement";
import CurrencyManager from "@/components/superadmin/sections/CurrencyManager";
import OfferManager from "@/components/superadmin/sections/OfferManager";
import PaymentMethods from "@/components/superadmin/sections/PaymentMethods";
import PriceHistory from "@/components/superadmin/sections/PriceHistory";
import PricingSettings from "@/components/superadmin/sections/PricingSettings";
import NotificationCenter from "@/components/superadmin/sections/NotificationCenter";
import SupportTickets from "@/components/superadmin/sections/SupportTickets";
import AuditLogs from "@/components/superadmin/sections/AuditLogs";
import PlatformSettings from "@/components/superadmin/sections/PlatformSettings";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "users", label: "User Management", icon: Users, group: "Management" },
  { id: "projects", label: "Project Management", icon: FolderGit2, group: "Management" },
  { id: "builds", label: "Build History", icon: Hammer, group: "Management" },
  { id: "payments", label: "Payment Requests", icon: Receipt, group: "Management" },
  { id: "plans", label: "Plans & Pricing", icon: Crown, group: "Pricing" },
  { id: "currencies", label: "Currency Manager", icon: Globe, group: "Pricing" },
  { id: "offers", label: "Offers & Coupons", icon: Tag, group: "Pricing" },
  { id: "payment_methods", label: "Payment Methods", icon: CreditCard, group: "Pricing" },
  { id: "price_history", label: "Price History", icon: History, group: "Pricing" },
  { id: "pricing_settings", label: "Pricing Settings", icon: Settings, group: "Pricing" },
  { id: "notifications", label: "Notification Center", icon: Bell, group: "System" },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy, group: "System" },
  { id: "audit", label: "Audit Logs", icon: ScrollText, group: "System" },
  { id: "settings", label: "Platform Settings", icon: Settings, group: "System" },
];

export default function SuperAdminDashboard() {
  const [section, setSection] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logAudit({ action: "admin.login", targetType: "system", details: "Super Admin accessed control center" }).finally(() => setBootstrapped(true));
  }, []);

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardOverview />;
      case "users": return <UserManagement />;
      case "projects": return <ProjectManagement />;
      case "builds": return <BuildHistorySection />;
      case "payments": return <PaymentRequests />;
      case "plans": return <PlansManagement />;
      case "currencies": return <CurrencyManager />;
      case "offers": return <OfferManager />;
      case "payment_methods": return <PaymentMethods />;
      case "price_history": return <PriceHistory />;
      case "pricing_settings": return <PricingSettings />;
      case "notifications": return <NotificationCenter />;
      case "tickets": return <SupportTickets />;
      case "audit": return <AuditLogs />;
      case "settings": return <PlatformSettings />;
      default: return <DashboardOverview />;
    }
  };

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" />
      </div>
    );
  }

  const groups = [...new Set(NAV.map(n => n.group))];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-950 text-gray-300 flex-col transition-transform ${mobileNav ? "flex translate-x-0" : "hidden lg:flex -translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 flex items-center gap-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
          <div>
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-[10px] text-gray-500">AppForge Control</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {groups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 px-3 mb-1">{group}</p>
              {NAV.filter(n => n.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setMobileNav(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${section === item.id ? "bg-[#4F7CFF] text-white" : "hover:bg-white/5 text-gray-400"}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" onClick={() => navigate("/dashboard")}>
            <LogOut className="w-4 h-4 mr-2" />Exit to App
          </Button>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileNav(false)} />}

      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setMobileNav(true)}><ChevronRight className="w-5 h-5" /></Button>
          <span className="font-semibold">{NAV.find((n) => n.id === section)?.label}</span>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}