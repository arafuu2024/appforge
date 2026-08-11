import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import {
  Smartphone, Download, Copy, ExternalLink, RotateCcw, Trash2,
  MoreVertical, Link2, Package, Globe, Terminal, Hash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";
import { isValidWebsiteUrl } from "@/lib/urlValidation";
import { copyToClipboardWithFallback } from "@/lib/clipboard";
import BuildLogsDialog from "@/components/myapps/BuildLogsDialog";

const statusStyles = {
  completed: "bg-[#22C55E]/10 text-[#22C55E]",
  building: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  failed: "bg-[#EF4444]/10 text-[#EF4444]",
  draft: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function AppCard({ project, index = 0, aabAllowed = false, onDeleted }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const status = project.status || "draft";
  const hasApk = Boolean(project.apk_url);
  const websiteOk = isValidWebsiteUrl(project.website_url);

  const copyToClipboard = async (text, label) => {
    if (!text) {
      toast({ title: "Nothing to copy", description: `${label} is not available.`, variant: "warning" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access was blocked.", variant: "destructive" });
    }
  };

  const copyLink = async () => {
    if (!project.apk_url) {
      toast({ title: "Nothing to copy", description: "Download link is not available.", variant: "warning" });
      return;
    }
    const ok = await copyToClipboardWithFallback(project.apk_url);
    if (ok) toast({ title: "Link copied successfully" });
    else toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
  };

  const handleDownload = (type) => {
    const url = type === "apk" ? project.apk_url : project.aab_url;
    if (!url) {
      toast({ title: "Not available", description: `The ${type.toUpperCase()} file isn't ready yet.`, variant: "warning" });
      return;
    }
    if (type === "aab" && !aabAllowed) {
      toast({ title: "Upgrade required", description: "AAB downloads need a paid plan.", variant: "warning" });
      return;
    }
    window.open(url, "_blank");
    base44.entities.Project.update(project.id, { downloads: (project.downloads || 0) + 1 }).catch(() => {});
  };

  const openWebsite = () => {
    if (!websiteOk) {
      toast({ title: "Unavailable", description: "This app has no valid website URL.", variant: "warning" });
      return;
    }
    window.open(project.website_url, "_blank", "noopener,noreferrer");
  };

  const openDownloadUrl = () => {
    if (!project.apk_url) {
      toast({ title: "This build is not available.", variant: "warning" });
      return;
    }
    window.open(project.apk_url, "_blank", "noopener,noreferrer");
  };

  const rebuild = () => navigate(`/build/${project.id}`);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.Project.delete(project.id);
      toast({ title: "App deleted", description: `${project.name} has been removed.` });
      onDeleted?.();
    } catch {
      toast({ title: "Delete failed", description: "Could not delete this app.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden card-hover flex flex-col"
      >
        {/* Header: icon + status */}
        <div className="h-28 bg-gradient-to-br from-[#4F7CFF]/10 to-[#7C3AED]/10 flex items-center justify-center relative">
          {project.app_icon ? (
            <Image
              src={project.app_icon}
              alt={project.name}
              fittingType="fill"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-[#4F7CFF]" />
            </div>
          )}
          <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[status]}`}>
            {status}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Title + menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{project.package_name || "—"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => copyToClipboard(project.package_name, "Package name")}>
                  <Package className="w-4 h-4 mr-2" /> Copy Package Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(project.website_url, "Website URL")}>
                  <Globe className="w-4 h-4 mr-2" /> Copy Website URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(project.id, "Build ID")}>
                  <Hash className="w-4 h-4 mr-2" /> Copy Build ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openDownloadUrl}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLogsOpen(true)}>
                  <Terminal className="w-4 h-4 mr-2" /> View Build Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[#EF4444]" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-4">
            <Meta label="Version" value={`v${project.version || "1.0.0"}`} />
            <Meta label="APK Size" value={formatBytes(project.apk_size)} />
            <Meta label="Build Date" value={formatDate(project.created_date)} />
            <Meta label="Last Updated" value={timeAgo(project.updated_date)} />
            <div className="col-span-2 min-w-0">
              <Meta label="Website" value={project.website_url || "—"} truncate />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto grid grid-cols-2 gap-2">
            {status === "completed" && (
              <>
                <Button
                  size="sm"
                  className="h-9 rounded-lg text-xs bg-gradient-primary text-white col-span-2"
                  onClick={() => handleDownload("apk")}
                  disabled={!hasApk}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download APK
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg text-xs"
                  onClick={copyLink}
                  disabled={!hasApk}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg text-xs"
                  onClick={openWebsite}
                  disabled={!websiteOk}
                  title={!websiteOk ? "No valid website URL" : undefined}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Website
                </Button>
              </>
            )}
            {status === "draft" && (
              <Button
                size="sm"
                className="h-9 rounded-lg text-xs bg-gradient-primary text-white col-span-2"
                onClick={rebuild}
              >
                Continue Setup
              </Button>
            )}
            {status === "building" && (
              <Button size="sm" disabled className="h-9 rounded-lg text-xs col-span-2">
                Building...
              </Button>
            )}
            {status === "failed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg text-xs text-[#EF4444] col-span-2"
                onClick={rebuild}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry Build
              </Button>
            )}
            {status !== "building" && status !== "draft" && (
              <>
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" onClick={rebuild}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Rebuild
                </Button>
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs text-[#EF4444]" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <BuildLogsDialog open={logsOpen} onOpenChange={setLogsOpen} project={project} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {project.name} and all its build data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-[#EF4444] hover:bg-[#EF4444]/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const Meta = ({ label, value, truncate }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
    <p className={`text-xs font-medium ${truncate ? "truncate" : ""}`}>{value || "—"}</p>
  </div>
);