import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getBuildsByUser } from "@/lib/buildService";
import { StatCard, SectionHeader, EmptyState } from "@/components/superadmin/ui";
import { Users, FolderGit2, Hammer, CheckCircle2, XCircle, HardDrive, Receipt, Crown } from "lucide-react";
import { formatBytes, timeAgo } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.Project.list().catch(() => []),
      // Get builds from Supabase (all users for admin view)
      (async () => {
        try {
          // For superadmin, we need all builds. Use a service account or fetch all.
          // For now, fetch current user's builds. If no user, return empty.
          const user = await base44.auth.me();
          if (user?.email) {
            return await getBuildsByUser(user.email, 1000);
          }
          return [];
        } catch {
          return base44.entities.BuildHistory.list("-build_date", 200).catch(() => []);
        }
      })(),
      base44.entities.PaymentRequest.list("-created_date", 200).catch(() => []),
    ]).then(([users, projects, builds, payments]) => {
      const today = new Date().toDateString();
      const successful = builds.filter(b => b.build_status === "completed");
      const failed = builds.filter(b => b.build_status === "failed");
      const approvedPayments = payments.filter(p => p.status === "approved");
      const revenue = approvedPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const storageUsed = projects.reduce((s, p) => s + (p.apk_size || 0), 0);
      const activePlans = users.filter(u => u.subscription && u.subscription !== "free").length;
      const appsToday = projects.filter(p => p.created_date && new Date(p.created_date).toDateString() === today).length;
      setData({ users, projects, builds, payments, successful, failed, revenue, storageUsed, activePlans, appsToday });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" /></div>;

  const { users, projects, builds, payments, successful, failed, revenue, storageUsed, activePlans, appsToday } = data;

  return (
    <div className="space-y-6">
      <SectionHeader title="Super Admin Dashboard" desc="Live platform overview and system health" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} color="#4F7CFF" />
        <StatCard icon={FolderGit2} label="Total Apps" value={projects.length} color="#7C3AED" />
        <StatCard icon={Hammer} label="Apps Built Today" value={appsToday} color="#22C55E" />
        <StatCard icon={CheckCircle2} label="Successful Builds" value={successful.length} color="#22C55E" />
        <StatCard icon={XCircle} label="Failed Builds" value={failed.length} color="#EF4444" />
        <StatCard icon={Crown} label="Active Plans" value={activePlans} color="#F59E0B" />
        <StatCard icon={Receipt} label="Revenue (BDT)" value={`৳${revenue.toLocaleString()}`} color="#22C55E" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(storageUsed)} color="#7C3AED" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Latest Users" empty={users.length === 0} emptyLabel="users">
          {users.slice(0, 6).map(u => (
            <Row key={u.id} avatar={u} title={u.full_name || "Unnamed"} sub={u.email} right={timeAgo(u.created_date)} />
          ))}
        </Panel>
        <Panel title="Latest Builds" empty={builds.length === 0} emptyLabel="builds">
          {builds.slice(0, 6).map(b => (
            <Row key={b.id} icon={b.build_status === "completed" ? CheckCircle2 : XCircle} iconColor={b.build_status === "completed" ? "#22C55E" : "#EF4444"} title={b.app_name} sub={timeAgo(b.build_date)} />
          ))}
        </Panel>
        <Panel title="Latest Payments" empty={payments.length === 0} emptyLabel="payments">
          {payments.slice(0, 6).map(p => (
            <Row key={p.id} icon={Receipt} iconColor="#F59E0B" title={p.full_name} sub={`${PLANS[p.plan]?.name || p.plan} · ৳${(p.amount || 0).toLocaleString()}`} badge={p.status} />
          ))}
        </Panel>
        <Panel title="Latest Errors" empty={failed.length === 0} emptyLabel="errors" emptyIcon={CheckCircle2}>
          {failed.slice(0, 6).map(b => (
            <Row key={b.id} icon={XCircle} iconColor="#EF4444" title={b.app_name} sub={timeAgo(b.build_date)} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

const Panel = ({ title, children, empty, emptyLabel, emptyIcon }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-5">
    <h3 className="font-semibold mb-4">{title}</h3>
    {empty ? <EmptyState label={emptyLabel} icon={emptyIcon} /> : children}
  </div>
);

const Row = ({ avatar, icon: Icon, iconColor, title, sub, right, badge }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
    {avatar && (
      <div className="w-8 h-8 rounded-lg bg-gradient-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
        {(avatar.full_name || avatar.email)[0]?.toUpperCase()}
      </div>
    )}
    {Icon && !avatar && (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconColor}15` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{sub}</p>
    </div>
    {badge && <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${badge === "approved" ? "bg-[#22C55E]/10 text-[#22C55E]" : badge === "pending" ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}>{badge}</span>}
    {right && <span className="text-xs text-muted-foreground shrink-0">{right}</span>}
  </div>
);