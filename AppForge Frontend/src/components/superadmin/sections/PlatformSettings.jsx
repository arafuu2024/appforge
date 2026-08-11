import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader, Spinner } from "@/components/superadmin/ui";
import { saveSetting, fetchSettings } from "@/lib/superadmin/audit";
import { Save, Loader2, Wrench, Globe, Palette, Shield, Bell } from "lucide-react";

const SETTING_DEFS = [
  { key: "maintenance_mode", label: "Maintenance Mode", desc: "Show a maintenance page to all users", category: "general", type: "toggle", icon: Wrench },
  { key: "registration_enabled", label: "Registration Enabled", desc: "Allow new users to sign up", category: "general", type: "toggle", icon: Shield },
  { key: "email_verification_required", label: "Email Verification Required", desc: "Require email verification before login", category: "general", type: "toggle", icon: Shield },
  { key: "brand_name", label: "Brand Name", desc: "Platform display name", category: "general", type: "text", icon: Globe },
  { key: "default_currency", label: "Default Currency", desc: "Default currency for new users", category: "payment", type: "select", options: ["BDT", "USD", "EUR", "INR", "GBP"], icon: Globe },
  { key: "default_theme", label: "Default Theme", desc: "Default theme for new users", category: "theme", type: "select", options: ["light", "dark", "system"], icon: Palette },
  { key: "build_timeout", label: "Build Timeout (seconds)", desc: "Maximum build duration", category: "build", type: "text", icon: Wrench },
  { key: "max_upload_size", label: "Max Upload Size (MB)", desc: "Maximum file upload size", category: "build", type: "text", icon: Wrench },
  { key: "announcement", label: "Platform Announcement", desc: "Shown to all users in the dashboard", category: "general", type: "textarea", icon: Bell },
];

export default function PlatformSettings() {
  const [settings, setSettings] = useState({});
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      const defaults = {};
      SETTING_DEFS.forEach(d => {
        if (d.type === "toggle") defaults[d.key] = s[d.key] === "true";
        else defaults[d.key] = s[d.key] || "";
      });
      setDrafts(defaults);
    }).finally(() => setLoading(false));
  }, []);

  const save = async (def) => {
    setSaving(def.key);
    const val = drafts[def.key];
    const ok = await saveSetting(def.key, def.type === "toggle" ? String(val) : String(val || ""), def.category);
    if (ok) {
      setSettings(prev => ({ ...prev, [def.key]: def.type === "toggle" ? String(val) : String(val || "") }));
      toast({ title: "Saved", description: `${def.label} updated.` });
    } else {
      toast({ title: "Error", description: "Could not save setting.", variant: "destructive" });
    }
    setSaving(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Settings" desc="Configure platform behavior — all changes persist immediately" />

      {SETTING_DEFS.map(def => {
        const Icon = def.icon;
        const val = drafts[def.key];
        const changed = def.type === "toggle" ? String(val) !== (settings[def.key] || "false") : val !== (settings[def.key] || "");
        return (
          <div key={def.key} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#4F7CFF]/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[#4F7CFF]" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{def.label}</p>
                <p className="text-xs text-muted-foreground">{def.desc}</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                {def.type === "toggle" && (
                  <button onClick={() => setDrafts(p => ({ ...p, [def.key]: !p[def.key] }))} className={`relative w-12 h-7 rounded-full transition-colors ${val ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${val ? "translate-x-5" : ""}`} />
                  </button>
                )}
                {def.type === "text" && <Input value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} className="rounded-xl" />}
                {def.type === "textarea" && <Textarea value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} rows={3} className="rounded-xl resize-none" />}
                {def.type === "select" && (
                  <select value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} className="h-10 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm w-full">
                    {def.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>
              <Button size="sm" className="rounded-xl" variant={changed ? "default" : "outline"} disabled={saving === def.key || !changed} onClick={() => save(def)}>
                {saving === def.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Save
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}