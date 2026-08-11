import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SectionHeader, SearchBar, EmptyState, ConfirmDialog } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";
import { FolderGit2, Trash2, Eye, Loader2, ExternalLink, Copy } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { copyToClipboardWithFallback } from "@/lib/clipboard";

const STATUS_STYLE = {
  completed: "bg-[#22C55E]/10 text-[#22C55E]",
  building: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  failed: "bg-[#EF4444]/10 text-[#EF4444]",
  draft: "bg-gray-100 text-gray-500 dark:bg-gray-800",
};

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const { toast } = useToast();

  const load = () => {
    Promise.all([
      base44.entities.Project.list("-created_date").catch(() => []),
      base44.entities.User.list().catch(() => []),
    ]).then(([p, u]) => { setProjects(p); setUsers(u); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const filtered = projects.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.website_url || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.package_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = async (url) => {
    const ok = await copyToClipboardWithFallback(url);
    if (ok) toast({ title: "Link copied successfully" });
    else toast({ title: "Copy failed", variant: "destructive" });
  };

  const del = async () => {
    setBusy(confirm.id);
    try {
      await base44.entities.Project.delete(confirm.id);
      await logAudit({ action: "project.delete", targetType: "project", targetId: confirm.id, details: `Deleted ${confirm.name}` });
      toast({ title: "Deleted", description: `${confirm.name} has been removed.` });
      setConfirm(null);
      load();
    } catch {
      toast({ title: "Error", description: "Could not delete project.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Project Management" desc="View, inspect, and delete all user projects" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, URL, or package..." />

      {filtered.length === 0 ? (
        <EmptyState label="projects" icon={FolderGit2} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.map(p => {
            const owner = userMap[p.created_by_id];
            return (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center shrink-0"><FolderGit2 className="w-4 h-4 text-[#4F7CFF]" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.website_url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[p.status] || ""}`}>{p.status}</span>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatBytes(p.apk_size)}</span>
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setDetail(p)} title="View details"><Eye className="w-4 h-4" /></Button>
                  {p.apk_url && <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => copyLink(p.apk_url)} title="Copy download link"><Copy className="w-4 h-4" /></Button>}
                  {p.apk_url && <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => window.open(p.apk_url, "_blank")} title="Open download"><ExternalLink className="w-4 h-4" /></Button>}
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444]" onClick={() => setConfirm(p)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>{detail?.website_url}</DialogDescription></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <DetailRow label="Owner" value={userMap[detail.created_by_id]?.email || detail.created_by_id || "—"} />
              <DetailRow label="Package" value={detail.package_name || "—"} />
              <DetailRow label="Version" value={detail.version || "1.0.0"} />
              <DetailRow label="Status" value={detail.status} />
              <DetailRow label="APK Size" value={formatBytes(detail.apk_size)} />
              <DetailRow label="Build Type" value={detail.build_type} />
              <DetailRow label="Downloads" value={detail.downloads || 0} />
              <DetailRow label="Created" value={formatDate(detail.created_date)} />
              <DetailRow label="Updated" value={timeAgo(detail.updated_date)} />
              {detail.apk_url && <DetailRow label="APK URL" value={<a href={detail.apk_url} target="_blank" rel="noreferrer" className="text-[#4F7CFF] underline truncate">Download link</a>} />}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete Project"
        description={`This will permanently delete "${confirm?.name}" and all its build data. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        busy={busy === confirm?.id}
        onConfirm={del}
      />
    </div>
  );
}

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-3 min-w-0"><span className="text-muted-foreground shrink-0">{label}</span><span className="font-medium text-right truncate">{value}</span></div>
);