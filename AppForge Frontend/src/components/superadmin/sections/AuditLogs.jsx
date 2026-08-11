import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { SectionHeader, SearchBar, EmptyState } from "@/components/superadmin/ui";
import { timeAgo } from "@/lib/format";
import { ScrollText, Loader2 } from "lucide-react";

const ACTION_STYLE = {
  "user.": "text-[#4F7CFF]",
  "project.": "text-[#7C3AED]",
  "payment.": "text-[#22C55E]",
  "setting.": "text-[#F59E0B]",
  "notification.": "text-[#7C3AED]",
  "email.": "text-[#F59E0B]",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    base44.entities.AuditLog.list("-created_date", 500)
      .then(setLogs)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.actor_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.details || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Audit Logs" desc="Every admin action is logged with actor, target, and timestamp" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by action, email, or details..." />

      {filtered.length === 0 ? (
        <EmptyState label="logs" icon={ScrollText} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.slice(0, 200).map(l => {
            const colorClass = Object.entries(ACTION_STYLE).find(([prefix]) => l.action?.startsWith(prefix))?.[1] || "text-foreground";
            return (
              <div key={l.id} className="flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <ScrollText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-mono font-medium ${colorClass}`}>{l.action}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(l.created_date)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{l.details}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">by {l.actor_email}{l.target_type ? ` · ${l.target_type}` : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}