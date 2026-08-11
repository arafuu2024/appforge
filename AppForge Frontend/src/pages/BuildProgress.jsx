import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createBuildRecord, updateBuildStatus as updateBuildRecord, getBuild as getBuildFromSupabase } from "@/lib/buildService";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Download, RotateCcw, Share2, Trash2, AlertCircle, Copy } from "lucide-react";
import confetti from "canvas-confetti";
import PhoneMockup from "@/components/landing/PhoneMockup";
import { useToast } from "@/components/ui/use-toast";
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
import { useAuth } from "@/lib/AuthContext";
import { generateApk } from "@/lib/buildApi";
import { copyToClipboardWithFallback } from "@/lib/clipboard";
import { canUseFeature, featureLabel, getPlan } from "@/lib/plans";

const BUILD_STEPS = [
  "Validating Website",
  "Creating Android Project",
  "Compiling APK",
  "Signing APK",
  "Uploading",
];

export default function BuildProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [apkReady, setApkReady] = useState(false);
  const [aabReady, setAabReady] = useState(false);
  const [artifactError, setArtifactError] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const plan = getPlan(user);
  const aabAllowed = canUseFeature(user, "aab");

  const log = (msg) => ({ time: new Date().toLocaleTimeString(), msg });
  const logsRef = useRef([]);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  // Cloud build flow: trigger GitHub Actions via the backend (returns immediately),
  // then poll Supabase every 5s until the build row flips to completed/failed.
  const runBuild = async (p) => {
    setArtifactError(false);
    const startedAt = Date.now();
    setLogs([log("Preparing project...")]);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const POLL_MS = 5000;
    const MAX_WAIT_MS = 30 * 60 * 1000; // give up polling after 30 min

    // Cosmetic step/progress driver while the cloud build runs
    const stepTimer = setInterval(() => {
      setCurrentStep((s) => {
        const next = Math.min(s + 1, BUILD_STEPS.length - 2);
        if (next > s) setLogs((prev) => [...prev, log(`${BUILD_STEPS[next]}...`)]);
        return next;
      });
      setProgress((pr) => Math.min(pr + 3, 92)); // slow creep; cloud builds take minutes
    }, POLL_MS);

    let pollTimer = null;
    const stopTimers = () => {
      clearInterval(stepTimer);
      if (pollTimer) clearInterval(pollTimer);
    };

    const onFailed = (message, failLogsExtra = []) => {
      stopTimers();
      const failLogs = [...logsRef.current, ...failLogsExtra, log(`Build failed: ${message || "unknown error"}`)];
      setArtifactError(true);
      setLogs(failLogs);
    };

    try {
      // 1. Trigger the cloud build. The backend dispatches a GitHub Actions
      //    workflow and responds immediately with a buildId.
      setLogs((prev) => [...prev, log("Triggering cloud build (GitHub Actions)...")]);

      const data = await generateApk({
        appName: p.name,
        website: p.website_url,
        packageName: p.package_name || `com.appforge.${(p.name || "app").replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
        version: p.version || "1.0.0",
        iconUrl: p.app_icon,
        user_email: user?.email,
      });

      const buildId = data.buildId;
      if (!buildId) throw new Error("Backend did not return a buildId");

      setLogs((prev) => [
        ...prev,
        log(`Cloud build queued: ${buildId}`),
        log("Waiting for the build to finish — polling status..."),
      ]);

      // 2. Write the processing record to Supabase so the UI, dashboards,
      //    and the GitHub Action can all track the same row.
      await createBuildRecord({
        build_id: buildId,
        user_email: user?.email || user?.id || "anonymous@example.com",
        website_url: p.website_url,
        app_name: p.name,
        package_name: p.package_name,
        version: p.version || "1.0.0",
        build_status: "processing",
      }).catch(() => {});

      // 3. Poll Supabase for the status flip.
      pollTimer = setInterval(async () => {
        try {
          if (Date.now() - startedAt > MAX_WAIT_MS) {
            onFailed("Timed out waiting for the cloud build status.");
            return;
          }

          const b = await getBuildFromSupabase(buildId);
          if (!b) return; // row not visible yet — keep polling

          if (b.status === "completed") {
            stopTimers();
            const downloadUrl = `${backendUrl}/download/${buildId}`;
            const successLogs = [...logsRef.current, log("Finishing..."), log("Build completed successfully! 🎉")];
            setLogs(successLogs);
            setProgress(100);
            setCurrentStep(BUILD_STEPS.length - 1);
            setCompleted(true);
            setApkReady(true);
            setArtifactError(false);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#4F7CFF", "#7C3AED", "#22C55E", "#F59E0B"] });
            await base44.entities.Project.update(id, {
              status: "completed",
              build_progress: 100,
              apk_url: downloadUrl,
            }).catch(() => {});
            setProject((prev) => ({ ...prev, apk_url: downloadUrl, status: "completed" }));
          } else if (b.status === "failed") {
            onFailed(b.error_message || "The cloud build reported a failure.");
            await updateBuildRecord(buildId, "failed", {
              build_duration: (Date.now() - startedAt) / 1000,
              build_logs: logsRef.current.map((l) => `[${l.time}] ${l.msg}`).join("\n"),
            }).catch(() => {});
          }
          // status === "processing" → keep polling
        } catch {
          // transient poll errors are ignored; next tick retries
        }
      }, POLL_MS);
    } catch (e) {
      onFailed(e.message || "unknown error");
      // Mark the Supabase row failed too, if one was created
      updateBuildRecord(id, "failed", {
        build_duration: (Date.now() - startedAt) / 1000,
        build_logs: logsRef.current.map((l) => `[${l.time}] ${l.msg}`).join("\n"),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;
    base44.entities.Project.get(id).then(async (p) => {
      if (cancelled) return;
      setProject(p);
      const hasApk = Boolean(p?.apk_url);
      setApkReady(hasApk);
      setAabReady(Boolean(p?.aab_url) && aabAllowed);
      if (p?.status === "completed" && hasApk) {
        setProgress(100);
        setCurrentStep(BUILD_STEPS.length - 1);
        setCompleted(true);
        setLogs([log("Build completed successfully! 🎉")]);
        return;
      }
      await runBuild(p);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const eta = Math.max(0, Math.ceil((100 - progress) * 0.2));

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: project.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share link copied to clipboard." });
      }
    } catch {}
  };

  const rebuild = async () => {
    setProgress(0);
    setCompleted(false);
    setLogs([]);
    setCurrentStep(0);
    setApkReady(false);
    setArtifactError(false);
    await base44.entities.Project.update(id, { status: "building", build_progress: 0 }).catch(() => {});
    await runBuild(project);
  };

  const deleteBuild = async () => {
    await base44.entities.Project.delete(id);
    navigate("/my-apps");
  };

  // Opens the backend downloadUrl directly in the browser — no fetch/blob.
  const handleDownload = (type) => {
    const url = type === "apk" ? project?.apk_url : project?.aab_url;
    if (!url) {
      toast({ title: "Not available", description: `The ${type.toUpperCase()} file isn't ready yet.`, variant: "warning" });
      return;
    }
    if (type === "aab" && !aabAllowed) {
      toast({ title: "Upgrade required", description: `${featureLabel.aab} needs the ${plan.name === "Free" ? "Starter" : plan.name} plan or higher.`, variant: "warning" });
      return;
    }
    window.open(url, "_blank");
    base44.entities.Project.update(id, { downloads: (project.downloads || 0) + 1 }).catch(() => {});
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">
              {completed ? "Build Complete! 🎉" : "Building Your App"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{Math.round(Math.min(progress, 100))}%</span>
              {!completed && (
                <span className="text-xs text-muted-foreground">~{eta}s remaining</span>
              )}
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2 mt-4">
              {BUILD_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-1.5"
                >
                  {i < currentStep ? (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    </div>
                  ) : i === currentStep && !completed ? (
                    <div className="w-6 h-6 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-[#4F7CFF] animate-spin" />
                    </div>
                  ) : completed ? (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800" />
                  )}
                  <span className={`text-sm ${i <= currentStep ? "font-medium" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div className="rounded-2xl bg-gray-900 p-5">
            <p className="text-xs text-gray-400 font-mono mb-3">Build Logs</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {logs.map((logItem, i) => (
                <p key={i} className="text-xs font-mono text-gray-300">
                  <span className="text-gray-500">[{logItem.time}]</span> {logItem.msg}
                </p>
              ))}
              {!completed && !artifactError && (
                <p className="text-xs font-mono text-[#4F7CFF] animate-pulse">▌</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <Button
                className="bg-gradient-primary text-white h-11 rounded-xl col-span-2 sm:col-span-1"
                onClick={() => handleDownload("apk")}
                disabled={!apkReady}
              >
                <Download className="w-4 h-4 mr-2" />
                Download APK
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={async () => {
                  if (!project?.apk_url) return;
                  const ok = await copyToClipboardWithFallback(project.apk_url);
                  if (ok) toast({ title: "Link copied successfully" });
                  else toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
                }}
                disabled={!apkReady}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl relative"
                onClick={() => handleDownload("aab")}
                disabled={!aabReady}
                title={!aabAllowed ? "Upgrade to download AAB" : undefined}
              >
                <Download className="w-4 h-4 mr-2" />
                Download AAB
                {!aabAllowed && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-white">PRO</span>
                )}
              </Button>
              <Button variant="outline" className="h-11 rounded-xl" onClick={rebuild}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Build Again
              </Button>
              <Button variant="outline" className="h-11 rounded-xl" onClick={share}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" className="h-11 rounded-xl text-[#EF4444] hover:text-[#EF4444]" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Build
              </Button>
            </motion.div>
          )}

          {artifactError && (
            <div className="mt-3 p-3 rounded-xl text-sm flex items-center gap-2 bg-[#EF4444]/10 text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Build failed — check the logs above and try building again.
            </div>
          )}

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this build?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the build and its download links. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteBuild} className="bg-[#EF4444] hover:bg-[#EF4444]/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Phone preview */}
        <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-start pt-12">
          <div className="sticky top-24">
            <PhoneMockup url={project.website_url || "myapp.com"} />
          </div>
        </div>
      </div>
    </div>
  );
}