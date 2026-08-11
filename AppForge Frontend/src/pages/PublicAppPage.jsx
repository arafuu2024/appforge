import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getBuild } from "@/lib/buildService";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Download, Copy, Globe, Package, Calendar,
  Tag, Loader2, ArrowLeft, ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes, formatDate } from "@/lib/format";

/**
 * Public app download page: /app/:id (id = BuildHistory id).
 * Anyone with the link can view the app details, scan the QR code,
 * copy the download link, and download the latest APK.
 */
export default function PublicAppPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [build, setBuild] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try Supabase first (build tracking), fall back to Base44 BuildHistory if not found
        let b = null;
        try {
          b = await getBuild(id);
        } catch (supabaseError) {
          // If Supabase doesn't have it, try Base44 (legacy builds)
          if (supabaseError.message !== 'Not found') {
            try {
              b = await base44.entities.BuildHistory.get(id);
            } catch {
              // Neither source has it
            }
          }
        }
        if (cancelled) return;
        setBuild(b);
        // Resolve the parent project so we always serve the LATEST APK.
        if (b?.project_id) {
          try {
            const p = await base44.entities.Project.get(b.project_id);
            if (!cancelled) setProject(p);
          } catch {
            /* project may be deleted; fall back to build's apk_url */
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const latestApkUrl = project?.apk_url || build?.apk_url;
  const appName = build?.app_name || project?.name || "Android App";
  const icon = project?.app_icon;
  const packageName = build?.package_name || project?.package_name;
  const website = build?.website_url || project?.website_url;
  const version = build?.version || project?.version || "1.0.0";
  const buildDate = build?.build_date || project?.updated_date || project?.created_date;
  const apkSize = project?.apk_size;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(pageUrl)}`;

  const copyLink = async () => {
    if (!latestApkUrl) {
      toast({ title: "Not available", description: "No download link is available.", variant: "warning" });
      return;
    }
    try {
      await navigator.clipboard.writeText(latestApkUrl);
      toast({ title: "Link copied", description: "Download link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access was blocked.", variant: "destructive" });
    }
  };

  const download = () => {
    if (!latestApkUrl) {
      toast({ title: "Not available", description: "The APK isn't ready yet.", variant: "warning" });
      return;
    }
    window.open(latestApkUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8 text-[#EF4444]" />
        </div>
        <h1 className="text-xl font-bold mb-1">App not found</h1>
        <p className="text-sm text-muted-foreground mb-5">This app page may have been deleted or the link is invalid.</p>
        <Link to="/">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to AppForge
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4F7CFF]/5 to-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> AppForge
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden"
        >
          {/* Hero */}
          <div className="p-8 text-center bg-gradient-to-br from-[#4F7CFF]/10 to-[#7C3AED]/10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden mb-4">
              {icon ? (
                <Image src={icon} alt={appName} fittingType="fill" className="w-20 h-20 object-cover" />
              ) : (
                <Smartphone className="w-9 h-9 text-[#4F7CFF]" />
              )}
            </div>
            <h1 className="text-xl font-bold">{appName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Android Application</p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-3">
            <Row icon={Tag} label="Version" value={`v${version}`} />
            <Row icon={Package} label="Package" value={packageName || "—"} />
            {website && <Row icon={Globe} label="Website" value={website} />}
            <Row icon={Calendar} label="Build Date" value={formatDate(buildDate)} />
            {apkSize > 0 && <Row icon={Download} label="APK Size" value={formatBytes(apkSize)} />}
          </div>

          {/* QR + actions */}
          <div className="p-6 pt-0 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <img src={qrSrc} alt="QR code for this app page" className="w-40 h-40 rounded-xl bg-white p-2 border border-gray-100 dark:border-gray-800" />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Scan to open this page
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-gradient-primary text-white text-base font-semibold"
              onClick={download}
              disabled={!latestApkUrl}
            >
              <Download className="w-5 h-5 mr-2" /> Download APK
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={copyLink} disabled={!latestApkUrl}>
              <Copy className="w-4 h-4 mr-2" /> Copy Download Link
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by AppForge · Always serves the latest build
        </p>
      </div>
    </div>
  );
}

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);