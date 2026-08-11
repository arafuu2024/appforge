import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BottomNav from "@/components/dashboard/BottomNav";
import MobileDrawer from "@/components/dashboard/MobileDrawer";

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Keep the drawer state synchronized with routing: any navigation closes it,
  // so it can never stay open after moving between pages.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}