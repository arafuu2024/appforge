import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getBuildsByUser } from "@/lib/buildService";
import { StatCard, SectionHeader, SearchBar, EmptyState } from "@/components/superadmin/ui";
import { formatDuration, timeAgo } from "@/lib/format";
import { Hammer, CheckCircle2, XCircle, Clock, Loader2, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function BuildHistorySection() {
  const [builds, setBuilds] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    // For superadmin, we need all builds. Use Supabase with a service account or fetch all.
    // For now, we'll fetch current user's builds. In a real implementation, you'd need
    // a backend endpoint to fetch all builds or use Supabase with elevated permissions.
    const fetchBuilds = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.email) {
          const builds = await getBuildsByUser(user.email, 1000);
          setBuilds(builds);
          return;
        }
      } catch (error) {
        console.warn("Could not fetch builds from Supabase:", error);
      }
      // Fallback to Base44
      base44.entities.BuildHistory.list("-build_date", 500)
        .then(setBuilds)
        .catch(() => setBuilds([]));
    };
    
    fetchBuilds().finally(() => setLoading(false));
  }, []);

  const successful = builds.filter(b => b.build_status === "completed");
  const failed = builds.filter(b => b.build_status === "failed");
  const avgTime = successful.filter(b => b.build_duration > 0).reduce((s, b) => s + b.build_duration, 0) / (successful.filter(b => b.build_duration > 0).length || 1);

  const filtered = builds.filter(b => {
    if (filter !== "all" && b.build_status !== filter) return false;
    if (search && !(b.app_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Build History" desc="All builds across the platform with logs and statistics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Hammer} label="Total Builds" value={builds.length} color="#4F7CFF" />
        <StatCard icon={CheckCircle2} label="Successful" value={successful.length} color="#22C55E" />
        <StatCard icon={XCircle} label="Failed" value={failed.length} color="#EF4444" />
        <StatCard icon={Clock} label="Avg Build Time" value={avgTime ? formatDuration(avgTime) : "—"} color="#7C3AED" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by app name..." />
        <div className="flex gap-2">
          {["all", "completed", "failed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-sm font-medium capitalize ${filter === f ? "bg-gradient-primary text-white" : "bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="builds" icon={Hammer} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.slice(0, 100).map(b => (
            <div key={b.id} className="flex items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${b.build_status === "completed" ? "bg-[#22C55E]/10" : "bg-[#EF4444]/10"}`}>
                {b.build_status === "completed" ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <XCircle className="w-4 h-4 text-[#EF4444]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.app_name}</p>
                <p className="text-xs text-muted-foreground truncate">{b.website_url} · {timeAgo(b.build_date)}</p>
              </div>
              {b.build_duration > 0 && <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDuration(b.build_duration)}</span>}
              <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" onClick={() => setDetail(b)} title="View logs"><Eye className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.app_name}</DialogTitle><DialogDescription>{detail?.website_url} · {detail?.build_status}</DialogDescription></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Version: <b className="text-foreground">{detail.version || "—"}</b></span>
                <span>Duration: <b className="text-foreground">{detail.build_duration ? formatDuration(detail.build_duration) : "—"}</b></span>
                <span>Date: <b className="text-foreground">{timeAgo(detail.build_date)}</b></span>
              </div>
              {detail.build_logs && (
                <div className="rounded-xl bg-gray-900 p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{detail.build_logs}</pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}