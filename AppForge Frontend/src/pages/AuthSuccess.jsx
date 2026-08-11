import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSuperAdmin } from "@/lib/adminUtils";

/**
 * Post-login router.
 * The platform's Google OAuth flow redirects here with a valid session token.
 * We resolve the authenticated user, then route by role:
 *   - Super admin  -> /super-admin
 *   - Everyone else -> /dashboard
 * Falls back to /login on any auth failure so the user is never stuck.
 */
export default function AuthSuccess() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;
        if (isSuperAdmin(user)) {
          navigate("/super-admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      {error ? (
        <p className="text-sm text-destructive text-center px-6">{error}</p>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-3">Signing you in…</p>
        </>
      )}
    </div>
  );
}