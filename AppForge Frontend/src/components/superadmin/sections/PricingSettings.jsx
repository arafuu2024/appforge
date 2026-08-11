import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { Loader2, Save } from "lucide-react";

const CHECKOUT_DEFS = [
  { key: "tax_percent", label: "Tax (%)", type: "number", desc: "Applied to all purchases" },
  { key: "vat_percent", label: "VAT (%)", type: "number", desc: "Value-added tax" },
  { key: "service_charge_percent", label: "Service Charge (%)", type: "number", desc: "Platform service fee" },
  { key: "platform_fee_fixed", label: "Platform Fee (fixed)", type: "number", desc: "Fixed fee per transaction" },
  { key: "coupon_allowed", label: "Coupons Allowed", type: "toggle", desc: "Allow coupon codes at checkout" },
  { key: "guest_checkout", label: "Guest Checkout", type: "toggle", desc: "Allow purchase without account" },
  { key: "min_price", label: "Minimum Price", type: "number", desc: "Minimum purchase amount" },
  { key: "max_price", label: "Maximum Price", type: "number", desc: "Maximum purchase amount (0=no limit)" },
  { key: "invoice_prefix", label: "Invoice Prefix", type: "text", desc: "e.g. INV-" },
  { key: "invoice_number_format", label: "Invoice Number Format", type: "text", desc: "e.g. {PREFIX}{YEAR}{SEQ}" },
];

const SUBSCRIPTION_DEFS = [
  { key: "trial_days", label: "Default Trial Days", type: "number", desc: "Trial period for new subscriptions" },
  { key: "grace_period_days", label: "Grace Period (days)", type: "number", desc: "Days before subscription expires" },
  { key: "auto_renewal", label: "Auto Renewal", type: "toggle", desc: "Enable auto-renewal by default" },
  { key: "lifetime_access", label: "Lifetime Access", type: "toggle", desc: "Allow lifetime plans" },
  { key: "upgrade_rule", label: "Upgrade Rule", type: "text", desc: "immediate, prorated, end_of_period" },
  { key: "downgrade_rule", label: "Downgrade Rule", type: "text", desc: "immediate, end_of_period" },
];

const PAGE_DEFS = [
  { key: "pricing_section_title", label: "Section Title", type: "text", desc: "Main heading" },
  { key: "pricing_subtitle", label: "Subtitle", type: "text", desc: "Subheading text" },
  { key: "pricing_button_text", label: "Button Text", type: "text", desc: "Default CTA text" },
  { key: "pricing_button_color", label: "Button Color", type: "color", desc: "Default button color" },
  { key: "popular_badge_text", label: "Popular Badge", type: "text", desc: "Badge for popular plan" },
  { key: "recommended_badge_text", label: "Recommended Badge", type: "text", desc: "Badge for recommended plan" },
  { key: "pricing_faq", label: "FAQ (one per line)", type: "textarea", desc: "Q: question? | A: answer" },
  { key: "pricing_terms", label: "Terms & Conditions", type: "textarea", desc: "Legal text" },
];

export default function PricingSettings() {
  const [tab, setTab] = useState("checkout");
  const [config, setConfig] = useState({});
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.PricingConfig.list().then((items) => {
      const map = {};
      items.forEach(i => { map[i.key] = i.value; });
      setConfig(map);
      setDrafts(map);
    }).finally(() => setLoading(false));
  }, []);

  const defs = tab === "checkout" ? CHECKOUT_DEFS : tab === "subscription" ? SUBSCRIPTION_DEFS : PAGE_DEFS;

  const save = async (def) => {
    setSaving(def.key);
    try {
      const me = await base44.auth.me();
      const existing = await base44.entities.PricingConfig.filter({ key: def.key });
      const val = String(drafts[def.key] ?? "");
      if (existing.length > 0) {
        await base44.entities.PricingConfig.update(existing[0].id, { value: val, updated_by_email: me?.email || "" });
      } else {
        await base44.entities.PricingConfig.create({ key: def.key, value: val, category: tab, updated_by_email: me?.email || "" });
      }
      await logAudit({ action: "pricing_config.update", targetType: "pricing_config", targetId: def.key, details: `${def.key} = ${val}` });
      setConfig(prev => ({ ...prev, [def.key]: val }));
      toast({ title: "Saved", description: `${def.label} updated.` });
    } catch { toast({ title: "Error", description: "Could not save setting.", variant: "destructive" }); }
    finally { setSaving(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Pricing Settings" desc="Configure checkout, subscription rules, and pricing page appearance" />

      <div className="flex gap-2">
        {["checkout", "subscription", "pricing_page"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab === t ? "bg-gradient-primary text-white" : "bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"}`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      <div className="space-y-3">
        {defs.map(def => {
          const val = drafts[def.key] ?? (def.type === "toggle" ? "false" : "");
          const changed = val !== (config[def.key] ?? (def.type === "toggle" ? "false" : ""));
          return (
            <div key={def.key} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold">{def.label}</p>
                  <p className="text-xs text-muted-foreground">{def.desc}</p>
                </div>
                <Button size="sm" className="rounded-xl shrink-0" variant={changed ? "default" : "outline"} disabled={saving === def.key || !changed} onClick={() => save(def)}>
                  {saving === def.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Save
                </Button>
              </div>
              {def.type === "toggle" && (
                <button onClick={() => setDrafts(p => ({ ...p, [def.key]: String(val) === "true" ? "false" : "true" }))} className={`relative w-12 h-7 rounded-full transition-colors ${String(val) === "true" ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}>
                  <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${String(val) === "true" ? "translate-x-5" : ""}`} />
                </button>
              )}
              {def.type === "text" && <Input value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} className="rounded-xl" />}
              {def.type === "number" && <Input type="number" value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} className="rounded-xl" />}
              {def.type === "color" && <Input type="color" value={val || "#4F7CFF"} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} className="rounded-xl h-9 p-1" />}
              {def.type === "textarea" && <Textarea value={val} onChange={(e) => setDrafts(p => ({ ...p, [def.key]: e.target.value }))} rows={4} className="rounded-xl resize-none text-sm" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}