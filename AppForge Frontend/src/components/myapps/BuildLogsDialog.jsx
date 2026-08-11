import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getBuildsByUser } from "@/lib/buildService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Terminal } from "lucide-react";
import { formatDuration, formatDate } from "@/lib/format";

/**
 * Opens a dialog showing the latest BuildHistory record for a project,
 * including status, duration, and the full build log output.
 */
export default function BuildLogsDialog({ open, onOpenChange, project }) {
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !project?.id) return;
    setLoading(true);
    
    // Try Supabase first, fallback to Base44 BuildHistory
    const fetchBuild = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.email) {
          const builds = await getBuildsByUser(user.email, 1000);
          // Find the build for this specific project (by project name or package)
          const projectBuild = builds.find(b => 
            b.app_name === project.name || 
            b.website_url === project.website_url ||
            b.package_name === project.package_name
          );
          if (projectBuild) {
            setBuild(projectBuild);
            return;
          }
        }
      } catch (supabaseError) {
        // Supabase not available or build not found, try Base44
      }
      
      // Fallback to Base44
      base44.entities.BuildHistory.filter({ project_id: project.id }, "-build_date", 1)
        .then((items) => setBuild(items[0] || null))
        .catch(() => setBuild(null));
    };
    
    fetchBuild().finally(() => setLoading(false));
  }, [open, project?.id, project?.name, project?.website_url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#4F7CFF]" />
            Build Logs — {project?.name}
          </DialogTitle>
          <DialogDescription>
            {build
              ? `${build.build_status === "completed" ? "Completed" : "Failed"} · ${formatDuration(build.build_duration)} · ${formatDate(build.build_date)}`
              : "Most recent build output for this app."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#4F7CFF]" />
          </div>
        ) : !build ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No build history found for this app yet.
          </div>
        ) : (
          <div className="rounded-xl bg-gray-950 p-4 max-h-80 overflow-y-auto">
            {build.build_logs ? (
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                {build.build_logs}
              </pre>
            ) : (
              <p className="text-xs font-mono text-gray-500">No log output was recorded for this build.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}