import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin } from "@/lib/adminUtils";
import { Loader2 } from "lucide-react";

export default function SuperAdminRoute({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin(user)) return <Navigate to="/dashboard" replace />;

  return children;
}