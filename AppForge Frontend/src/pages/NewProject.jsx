import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Globe, Upload, Github, ArrowRight, ArrowLeft,
  Check, Smartphone, Palette, Sun, Moon, Shield,
  Settings2, Flame, Megaphone, Eye, Rocket, Monitor, Loader2
} from "lucide-react";
import PhoneMockup from "@/components/landing/PhoneMockup";
import ImageUpload from "@/components/upload/ImageUpload";
import LoadingAnimationBuilder from "@/components/loading/LoadingAnimationBuilder";
import { useAuth } from "@/lib/AuthContext";
import { getPlan, findBlockedFeature, featureLabel, planNeededFor, PLANS } from "@/lib/plans";
import { validateWebsiteUrl, isValidWebsiteUrl } from "@/lib/urlValidation";

const STEPS = [
  { num: 1, label: "Source", icon: Globe },
  { num: 2, label: "App Info", icon: Smartphone },
  { num: 3, label: "Branding", icon: Palette },
  { num: 4, label: "Theme", icon: Sun },
  { num: 5, label: "Permissions", icon: Shield },
  { num: 6, label: "WebView", icon: Monitor },
  { num: 7, label: "Firebase", icon: Flame },
  { num: 8, label: "Ads", icon: Megaphone },
  { num: 9, label: "Loader", icon: Loader2 },
  { num: 10, label: "Preview", icon: Eye },
  { num: 11, label: "Generate", icon: Rocket },
];

const TOTAL = STEPS.length;

const permissions = [
  { id: "INTERNET", label: "Internet", desc: "Access the internet", required: true },
  { id: "CAMERA", label: "Camera", desc: "Take photos and videos" },
  { id: "LOCATION", label: "Location", desc: "Access GPS location" },
  { id: "STORAGE", label: "Storage", desc: "Read/write files" },
  { id: "MICROPHONE", label: "Microphone", desc: "Record audio" },
  { id: "NOTIFICATIONS", label: "Notifications", desc: "Send push notifications" },
  { id: "VIBRATE", label: "Vibrate", desc: "Vibrate the device" },
  { id: "BLUETOOTH", label: "Bluetooth", desc: "Connect to Bluetooth" },
];

const defaultLoadingConfig = {
  type: "material_circular",
  bg: "#0B1020",
  color: "#4F7CFF",
  size: 56,
  speed: 1,
  text: "Loading...",
  font: "Inter, sans-serif",
  fontSize: 14,
  logoPosition: "top",
  fullscreen: true,
  logo: "",
};

export default function NewProject() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState(null);
  const [suggestedPackage, setSuggestedPackage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const plan = getPlan(user);

  const [form, setForm] = useState({
    source_type: "url",
    website_url: "",
    name: "",
    package_name: "",
    app_icon: "",
    splash_logo: "",
    splash_background: "",
    feature_image: "",
    banner: "",
    primary_color: "#4F7CFF",
    accent_color: "#7C3AED",
    theme_mode: "system",
    permissions: ["INTERNET"],
    enable_pull_to_refresh: true,
    enable_file_download: true,
    enable_file_upload: true,
    enable_geolocation: false,
    enable_offline_mode: false,
    enable_firebase: false,
    enable_push_notifications: false,
    enable_ads: false,
    loading_animation: defaultLoadingConfig,
    build_type: "apk",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const togglePerm = (id) => {
    const perms = form.permissions.includes(id)
      ? form.permissions.filter((p) => p !== id)
      : [...form.permissions, id];
    update("permissions", perms);
  };

  const next = () => step < TOTAL && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  // Load the user's current project count to enforce subscription limits.
  useEffect(() => {
    base44.entities.Project.list("-created_date", 1000)
      .then((items) => {
        if (items.length >= plan.projects) {
          setLimit({ type: "projects", used: items.length, max: plan.projects });
        }
        const lastWithPkg = items.find((it) => it.package_name);
        if (lastWithPkg) setSuggestedPackage(lastWithPkg.package_name);
      })
      .catch(() => {});
  }, [plan.projects]);

  const handleGenerate = async () => {
    // 1. Project count limit
    if (limit) {
      toast({
        title: "Project limit reached",
        description: `Your ${plan.name} plan allows ${limit.max === Infinity ? "unlimited" : limit.max} project${limit.max === 1 ? "" : "s"}. Upgrade to create more.`,
        variant: "warning",
      });
      navigate("/billing");
      return;
    }

    // 2. Premium feature gating
    const blocked = findBlockedFeature(user, form);
    if (blocked) {
      const needed = planNeededFor(blocked);
      toast({
        title: `${featureLabel[blocked]} isn't on your plan`,
        description: `Upgrade to the ${PLANS[needed].name} plan to use ${featureLabel[blocked]}.`,
        variant: "warning",
      });
      navigate("/billing");
      return;
    }

    setSaving(true);
    try {
      const project = await base44.entities.Project.create({
        ...form,
        status: "building",
        build_progress: 0,
        version: "1.0.0",
        version_code: 1,
      });
      navigate(`/build/${project.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
      setSaving(false);
    }
  };

  const prefillPackage = () => {
    if (step === 2 && !form.package_name && suggestedPackage) {
      update("package_name", suggestedPackage);
    }
  };
  useEffect(prefillPackage, [step, suggestedPackage]); // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed = () => {
    if (step === 1) {
      if (form.source_type === "zip") return form.website_url.trim().length > 0;
      return isValidWebsiteUrl(form.website_url);
    }
    if (step === 2) return form.name.trim().length > 0;
    return true;
  };

  const renderStep = () => {
    const inputClass = "w-full h-11 px-4 rounded-xl bg-accent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20";

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Choose Source</h2>
              <p className="text-sm text-muted-foreground">Select how you want to provide your website content.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { type: "url", icon: Globe, label: "Website URL", desc: "Enter a live URL" },
                { type: "zip", icon: Upload, label: "Upload ZIP", desc: "Upload HTML files" },
                { type: "github", icon: Github, label: "GitHub Repo", desc: "Import from GitHub" },
              ].map((s) => (
                <button
                  key={s.type}
                  onClick={() => update("source_type", s.type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.source_type === s.type
                      ? "border-[#4F7CFF] bg-[#4F7CFF]/5"
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  }`}
                >
                  <s.icon className={`w-5 h-5 mb-2 ${form.source_type === s.type ? "text-[#4F7CFF]" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {form.source_type === "url" ? "Website URL" : form.source_type === "github" ? "Repository URL" : "Upload HTML ZIP"}
              </label>
              <input
                type="text"
                value={form.website_url}
                onChange={(e) => update("website_url", e.target.value)}
                onBlur={() => {
                  if (!form.website_url.trim()) return;
                  const { normalized } = validateWebsiteUrl(form.website_url);
                  if (normalized && normalized !== form.website_url) update("website_url", normalized);
                }}
                placeholder={form.source_type === "url" ? "https://example.com" : form.source_type === "github" ? "https://github.com/user/repo" : "Upload your ZIP file"}
                className={inputClass}
              />
              {form.source_type !== "zip" && form.website_url.trim() && (() => {
                const c = validateWebsiteUrl(form.website_url);
                return !c.valid ? (
                  <p className="text-xs text-[#EF4444] mt-1.5">{c.error}</p>
                ) : (
                  <p className="text-xs text-[#22C55E] mt-1.5">Valid URL — {c.normalized}</p>
                );
              })()}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">App Information</h2>
              <p className="text-sm text-muted-foreground">Basic details about your Android application.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">App Name</label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="My Awesome App" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Package Name</label>
                <input type="text" value={form.package_name} onChange={(e) => update("package_name", e.target.value)} placeholder="com.example.myapp" className={inputClass} />
                {suggestedPackage && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#4F7CFF]/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Previously used: <span className="font-medium text-foreground">{suggestedPackage}</span>
                    </p>
                    {form.package_name !== suggestedPackage && (
                      <button type="button" onClick={() => update("package_name", suggestedPackage)} className="text-xs font-medium text-[#4F7CFF] hover:underline shrink-0">
                        Use this
                      </button>
                    )}
                  </div>
                )}
                {suggestedPackage && form.package_name && form.package_name !== suggestedPackage && (
                  <p className="text-xs text-[#F59E0B] mt-1.5">
                    This differs from your previously used package name. Double-check before continuing.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Version</label>
                  <input type="text" defaultValue="1.0.0" className={inputClass} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Version Code</label>
                  <input type="number" defaultValue={1} className={inputClass} readOnly />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Branding</h2>
              <p className="text-sm text-muted-foreground">Upload your app icons and images. Drag & drop or browse — PNG, JPG, SVG, WEBP (max 10 MB).</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <ImageUpload label="App Icon" description="Shown on home screen" recommendedSize="512×512 PNG" value={form.app_icon} onChange={(v) => update("app_icon", v)} />
              <ImageUpload label="Splash Logo" description="Centered on splash screen" recommendedSize="Transparent PNG" value={form.splash_logo} onChange={(v) => update("splash_logo", v)} />
              <ImageUpload label="Splash Background" description="Behind the splash logo" aspect="wide" value={form.splash_background} onChange={(v) => update("splash_background", v)} />
              <ImageUpload label="Feature Image" description="Used in listings & sharing" aspect="wide" value={form.feature_image} onChange={(v) => update("feature_image", v)} />
              <ImageUpload label="Banner" description="Promotional banner" aspect="banner" value={form.banner} onChange={(v) => update("banner", v)} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Theme</h2>
              <p className="text-sm text-muted-foreground">Choose colors and appearance for your app.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                    <input type="text" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                    <input type="text" value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Theme Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "light", icon: Sun, label: "Light" },
                    { val: "dark", icon: Moon, label: "Dark" },
                    { val: "system", icon: Monitor, label: "System" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => update("theme_mode", t.val)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        form.theme_mode === t.val ? "border-[#4F7CFF] bg-[#4F7CFF]/5" : "border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      <t.icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Permissions</h2>
              <p className="text-sm text-muted-foreground">Select which permissions your app needs.</p>
            </div>
            <div className="space-y-2">
              {permissions.map((perm) => (
                <button
                  key={perm.id}
                  onClick={() => !perm.required && togglePerm(perm.id)}
                  disabled={perm.required}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    form.permissions.includes(perm.id)
                      ? "border-[#4F7CFF]/30 bg-[#4F7CFF]/5"
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    form.permissions.includes(perm.id) ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-gray-300"
                  }`}>
                    {form.permissions.includes(perm.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">WebView Features</h2>
              <p className="text-sm text-muted-foreground">Configure WebView behavior and capabilities.</p>
            </div>
            <div className="space-y-2">
              {[
                { key: "enable_pull_to_refresh", label: "Pull to Refresh", desc: "Swipe down to reload content" },
                { key: "enable_file_download", label: "File Downloads", desc: "Allow downloading files" },
                { key: "enable_file_upload", label: "File Uploads", desc: "Allow uploading files" },
                { key: "enable_geolocation", label: "Geolocation", desc: "Access device GPS" },
                { key: "enable_offline_mode", label: "Offline Mode", desc: "Cache content for offline use" },
              ].map((feat) => (
                <button
                  key={feat.key}
                  onClick={() => update(feat.key, !form[feat.key])}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    form[feat.key] ? "border-[#4F7CFF]/30 bg-[#4F7CFF]/5" : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{feat.label}</p>
                    <p className="text-xs text-muted-foreground">{feat.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form[feat.key] ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form[feat.key] ? "translate-x-4" : ""}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Firebase</h2>
              <p className="text-sm text-muted-foreground">Connect Firebase for analytics and notifications.</p>
            </div>
            <button
              onClick={() => update("enable_firebase", !form.enable_firebase)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                form.enable_firebase ? "border-[#F59E0B]/30 bg-[#F59E0B]/5" : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className={`w-5 h-5 ${form.enable_firebase ? "text-[#F59E0B]" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-semibold">Enable Firebase</p>
                  <p className="text-xs text-muted-foreground">Analytics, crash reporting, and more</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.enable_firebase ? "bg-[#F59E0B]" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.enable_firebase ? "translate-x-4" : ""}`} />
              </div>
            </button>
            {form.enable_firebase && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                <button
                  onClick={() => update("enable_push_notifications", !form.enable_push_notifications)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    form.enable_push_notifications ? "border-[#4F7CFF]/30 bg-[#4F7CFF]/5" : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Send notifications via FCM</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.enable_push_notifications ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.enable_push_notifications ? "translate-x-4" : ""}`} />
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Monetization</h2>
              <p className="text-sm text-muted-foreground">Configure ads and choose build output format.</p>
            </div>
            <button
              onClick={() => update("enable_ads", !form.enable_ads)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                form.enable_ads ? "border-[#22C55E]/30 bg-[#22C55E]/5" : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Megaphone className={`w-5 h-5 ${form.enable_ads ? "text-[#22C55E]" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-semibold">Enable AdMob</p>
                  <p className="text-xs text-muted-foreground">Display banner and interstitial ads</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.enable_ads ? "bg-[#22C55E]" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.enable_ads ? "translate-x-4" : ""}`} />
              </div>
            </button>
            <div>
              <label className="text-sm font-medium mb-2 block">Build Output Format</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "apk", label: "APK", desc: "Direct install" },
                  { val: "aab", label: "AAB", desc: "Play Store" },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => update("build_type", b.val)}
                    className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                      form.build_type === b.val ? "border-[#4F7CFF] bg-[#4F7CFF]/5" : "border-gray-100 dark:border-gray-800"
                    }`}
                  >
                    <p className="text-sm font-semibold">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 9:
        return <LoadingAnimationBuilder config={form.loading_animation} onChange={(cfg) => update("loading_animation", cfg)} />;

      case 10:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Preview</h2>
              <p className="text-sm text-muted-foreground">Review your app configuration before generating.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "App Name", value: form.name },
                { label: "Website", value: form.website_url },
                { label: "Package", value: form.package_name || "com.appforge.app" },
                { label: "Theme", value: form.theme_mode },
                { label: "Permissions", value: form.permissions.join(", ") },
                { label: "Firebase", value: form.enable_firebase ? "Enabled" : "Disabled" },
                { label: "Ads", value: form.enable_ads ? "Enabled" : "Disabled" },
                { label: "Loader", value: form.loading_animation.type },
                { label: "Build Output", value: (form.build_type || "apk").toUpperCase() },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-accent">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Ready to Generate!</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your Android app is configured and ready to build. Click the button below to start generating your {(form.build_type || "apk").toUpperCase()}.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={saving}
              className="bg-gradient-primary text-white hover:opacity-90 h-12 px-10 rounded-xl text-base font-semibold shadow-lg shadow-[#4F7CFF]/25"
            >
              {saving ? "Creating..." : "Generate App"}
              {!saving && <Rocket className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-wrap items-center gap-1 pb-2">
            {STEPS.map((s) => (
              <button
                key={s.num}
                onClick={() => s.num <= step && setStep(s.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  s.num === step
                    ? "bg-[#4F7CFF]/10 text-[#4F7CFF]"
                    : s.num < step
                    ? "text-[#22C55E]"
                    : "text-muted-foreground"
                }`}
              >
                {s.num < step ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    s.num === step ? "bg-[#4F7CFF] text-white" : "bg-gray-100 dark:bg-gray-800"
                  }`}>{s.num}</span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < TOTAL && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={prev} disabled={step === 1} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <span className="text-xs text-muted-foreground">Step {step} of {TOTAL}</span>
              <Button onClick={next} disabled={!canProceed()} className="bg-gradient-primary text-white rounded-xl hover:opacity-90">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-start pt-12">
          <div className="sticky top-24">
            <p className="text-xs font-medium text-muted-foreground text-center mb-4">Live Preview</p>
            <PhoneMockup url={form.website_url || "myapp.com"} />
          </div>
        </div>
      </div>
    </div>
  );
}