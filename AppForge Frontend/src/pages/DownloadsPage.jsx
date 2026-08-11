import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Download, Smartphone, FileArchive, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { canUseFeature } from "@/lib/plans";

export default function DownloadsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Project.filter({ status: "completed" }, "-created_date")
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const aabAllowed = canUseFeature(user, "aab");

  // Opens the backend download URL directly in the browser — no fetch/blob.
  const handleDownload = (project, type) => {
    const url = type === "apk" ? project.apk_url : project.aab_url;
    if (!url) {
      toast({ title: "Not available", description: `No ${type.toUpperCase()} file for this build.`, variant: "warning" });
      return;
    }
    if (type === "aab" && !aabAllowed) {
      toast({ title: "Upgrade required", description: "AAB downloads need a paid plan. Upgrade in Billing.", variant: "warning" });
      return;
    }
    window.open(url, "_blank");
    base44.entities.Project.update(project.id, { downloads: (project.downloads || 0) + 1 }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-40 bg-accent rounded-lg animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-accent animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Downloads</h1>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold mb-1">No downloads yet</h3>
          <p className="text-sm text-muted-foreground">Completed builds will appear here</p>
          <Button className="mt-5 bg-gradient-primary text-white rounded-xl" onClick={() => navigate("/new-project")}>
            Create your first app
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, i) => {
            const apkReady = Boolean(project.apk_url);
            const aabReady = Boolean(project.aab_url) && aabAllowed;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#4F7CFF]/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-[#4F7CFF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      v{project.version || "1.0.0"} · {project.downloads || 0} downloads
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs h-8 flex-1 sm:flex-none"
                    onClick={() => handleDownload(project, "apk")}
                    disabled={!apkReady}
                  >
                    <FileArchive className="w-3 h-3 mr-1.5" />
                    APK
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs h-8 flex-1 sm:flex-none relative"
                    onClick={() => handleDownload(project, "aab")}
                    disabled={!aabReady}
                    title={!aabAllowed ? "Upgrade to download AAB" : undefined}
                  >
                    {aabAllowed ? (
                      <FileArchive className="w-3 h-3 mr-1.5" />
                    ) : (
                      <Lock className="w-3 h-3 mr-1.5" />
                    )}
                    AAB
                    {!aabAllowed && <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-0.5 rounded-full bg-[#F59E0B] text-white">PRO</span>}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}