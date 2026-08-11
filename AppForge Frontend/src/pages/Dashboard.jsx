import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { isSuperAdmin } from "@/lib/adminUtils";
import { getBuildsByUser } from "@/lib/buildService";
import { Button } from "@/components/ui/button";
import {
  PlusCircle, Smartphone, Download, CheckCircle2, XCircle,
  ArrowUpRight, Clock, Package, Crown, HardDrive, Timer, TrendingUp,
} from "lucide-react";
import { getCurrentPlanId, PLANS } from "@/lib/plans";
import { formatBytes, formatDuration, timeAgo } from "@/lib/format";

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-[#22C55E] flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
  </motion.div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Project.list("-created_date", 1000),
      // Try Supabase first, fallback to Base44
      (async () => {
        try {
          const user = await base44.auth.me();
          if (user?.email) {
            return await getBuildsByUser(user.email);
          }
          return [];
        } catch {
          return base44.entities.BuildHistory.list("-build_date", 1000).catch(() => []);
        }
      })(),
    ])
      .then(([u, p, b]) => {
        setUser(u);
        setProjects(p);
        setBuilds(b);
        // Superadmin redirect moved to separate useEffect to avoid race conditions
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle superadmin redirect in a separate effect to avoid race conditions
  useEffect(() => {
    if (user && isSuperAdmin(user)) {
      // Only redirect if this is explicitly the superadmin account
      navigate("/super-admin", { replace: true });
    }
  }, [user, navigate]);

  const totalApps = projects.length;
  const totalBuilds = builds.length;
  const successfulBuilds = builds.filter((b) => b.build_status === "completed").length;
  const failedBuilds = builds.filter((b) => b.build_status === "failed").length;
  const totalDownloads = projects.reduce((sum, p) => sum + (p.downloads || 0), 0);
  const storageUsed = projects.reduce((sum, p) => sum + (p.apk_size || 0), 0);
  const completedWithDuration = builds.filter((b) => b.build_status === "completed" && b.build_duration > 0);
  const avgBuildTime = completedWithDuration.length
    ? completedWithDuration.reduce((s, b) => s + b.build_duration, 0) / completedWithDuration.length
    : 0;
  const latestBuild = builds[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-accent rounded-lg animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-accent animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-accent animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your apps today.</p>
      </motion.div>

      {/* Real stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Smartphone} label="Total Apps" value={totalApps} color="#4F7CFF" />
        <StatCard icon={Package} label="Total Builds" value={totalBuilds} color="#7C3AED" />
        <StatCard icon={CheckCircle2} label="Successful" value={successfulBuilds} color="#22C55E" />
        <StatCard icon={XCircle} label="Failed" value={failedBuilds} color="#EF4444" />
        <StatCard icon={Download} label="Downloads" value={totalDownloads} color="#7C3AED" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(storageUsed)} color="#F59E0B" />
        <StatCard icon={Timer} label="Avg Build Time" value={avgBuildTime ? formatDuration(avgBuildTime) : "—"} color="#4F7CFF" />
        <StatCard icon={Clock} label="Latest Build" value={latestBuild ? timeAgo(latestBuild.build_date) : "—"} color="#22C55E" />
      </div>

      {/* Subscription status */}
      {user && (() => {
        const pid = getCurrentPlanId(user);
        const p = PLANS[pid];
        const isPaid = pid !== "free";
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name} Plan {isPaid ? "" : "· Free tier"}</p>
                <p className="text-xs text-muted-foreground">
                  {p.projects === Infinity ? "Unlimited" : p.projects} projects · {p.buildsPerMonth === Infinity ? "Unlimited" : p.buildsPerMonth} builds/mo · {p.support} support
                </p>
              </div>
            </div>
            {pid !== "enterprise" && (
              <Link to="/upgrade-plan">
                <Button size="sm" className="bg-gradient-primary text-white rounded-xl">
                  {isPaid ? "Upgrade" : "Upgrade Now"}
                </Button>
              </Link>
            )}
          </motion.div>
        );
      })()}

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-[#4F7CFF] to-[#7C3AED] text-white min-w-0"
        >
          <h3 className="font-bold text-lg mb-2">Create New App</h3>
          <p className="text-white/70 text-sm mb-6">Convert your website into a premium Android application.</p>
          <Link to="/new-project">
            <Button className="bg-white text-[#4F7CFF] hover:bg-white/90 font-semibold">
              <PlusCircle className="w-4 h-4 mr-2" />
              Start Building
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 min-w-0"
        >
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-semibold">Recent Projects</h3>
            <Link to="/my-apps" className="text-xs text-[#4F7CFF] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-10 text-center">
              <Smartphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <Link to="/new-project">
                <Button size="sm" className="mt-3 bg-gradient-primary text-white">Create your first app</Button>
              </Link>
            </div>
          ) : (
            <div className="p-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  to={`/build/${project.id}`}
                  key={project.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors min-w-0 overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7CFF]/10 to-[#7C3AED]/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-[#4F7CFF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.website_url}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 capitalize ${
                    project.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                    project.status === "building" ? "bg-[#4F7CFF]/10 text-[#4F7CFF]" :
                    project.status === "failed" ? "bg-[#EF4444]/10 text-[#EF4444]" :
                    "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  }`}>
                    {project.status || "draft"}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    v{project.version || "1.0.0"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}