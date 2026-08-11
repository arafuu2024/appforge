import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logAudit } from "@/lib/superadmin/audit";
import { BILLING_PERIODS, COMMON_FEATURES, getPlanPrice, formatPrice } from "@/lib/dynamicPricing";
import { Loader2, Plus, X, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const VIS_OPTIONS = ["visible", "hidden", "featured", "popular", "recommended", "coming_soon", "limited_offer", "beta"];
const STATUS_OPTIONS = ["active", "draft", "archived"];

export default function PlanEditor({ plan, currencies, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureVal, setNewFeatureVal] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setForm({
        ...plan,
        billing_periods: JSON.parse(JSON.stringify(plan.billing_periods || {})),
        features: { ...plan.features },
        feature_list: [...(plan.feature_list || [])],
      });
    } else {
      setForm({
        name: "", internal_id: "", description: "", status: "active", visibility: "visible",
        order: 0, trial_days: 0, billing_periods: {}, features: {}, feature_list: [],
        button_text: "Get Started", ribbon_text: "", badge_text: "", accent_color: "#4F7CFF",
      });
    }
  }, [plan]);

  if (!form) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setBP = (period, k, v) => setForm(p => ({ ...p, billing_periods: { ...p.billing_periods, [period]: { ...p.billing_periods[period], [k]: v } } }));
  const setPrice = (period, code, v) => setForm(p => ({ ...p, billing_periods: { ...p.billing_periods, [period]: { ...p.billing_periods[period], prices: { ...(p.billing_periods[period]?.prices || {}), [code]: Number(v) || 0 } } } }));

  const addFeature = () => {
    if (!newFeatureKey.trim()) return;
    setForm(p => ({ ...p, features: { ...p.features, [newFeatureKey.trim()]: newFeatureVal.trim() || true } }));
    setNewFeatureKey(""); setNewFeatureVal("");
  };
  const removeFeature = (key) => setForm(p => { const f = { ...p.features }; delete f[key]; return { ...p, features: f }; });
  const updateFeatureVal = (key, val) => setForm(p => ({ ...p, features: { ...p.features, [key]: val } }));

  const validate = () => {
    if (!form.name.trim()) { toast({ title: "Validation", description: "Plan name is required.", variant: "warning" }); return false; }
    if (!form.internal_id.trim()) { toast({ title: "Validation", description: "Internal ID is required.", variant: "warning" }); return false; }
    for (const [period, bp] of Object.entries(form.billing_periods)) {
      if (bp.enabled && bp.prices) {
        for (const [code, price] of Object.entries(bp.prices)) {
          if (price < 0) { toast({ title: "Validation", description: `Negative price not allowed for ${period} ${code}.`, variant: "warning" }); return false; }
        }
      }
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const payload = { ...form, created_by_email: me?.email || "" };
      if (plan) {
        await base44.entities.Plan.update(plan.id, payload);
        await logAudit({ action: "plan.update", targetType: "plan", targetId: plan.id, details: `Updated ${form.name}` });
        for (const [period, bp] of Object.entries(form.billing_periods)) {
          if (bp.enabled && bp.prices) {
            for (const [code, price] of Object.entries(bp.prices)) {
              const oldPrice = getPlanPrice(plan, code, period);
              if (oldPrice !== price && price >= 0) {
                await base44.entities.PriceHistory.create({
                  plan_id: plan.id, plan_name: form.name, billing_period: period, currency_code: code,
                  old_price: oldPrice, new_price: price, changed_by_email: me?.email || "", reason: "Admin edit",
                }).catch(() => {});
              }
            }
          }
        }
        toast({ title: "Saved", description: `${form.name} has been updated.` });
      } else {
        const created = await base44.entities.Plan.create(payload);
        await logAudit({ action: "plan.create", targetType: "plan", targetId: created.id, details: `Created ${form.name}` });
        toast({ title: "Created", description: `${form.name} has been created.` });
      }
      onSaved();
    } catch { toast({ title: "Error", description: "Could not save plan.", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create Plan"}</DialogTitle>
          <DialogDescription>{plan ? form.name : "Configure a new subscription plan"}</DialogDescription>
        </DialogHeader>

        {/* General */}
        <Section title="General">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-xl" /></Field>
            <Field label="Internal ID"><Input value={form.internal_id} onChange={(e) => set("internal_id", e.target.value)} className="rounded-xl" placeholder="starter, professional..." /></Field>
            <Field label="Description" full><Input value={form.description} onChange={(e) => set("description", e.target.value)} className="rounded-xl" /></Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field label="Visibility">
              <Select value={form.visibility} onValueChange={(v) => set("visibility", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VIS_OPTIONS.map(v => <SelectItem key={v} value={v} className="capitalize">{v.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field label="Order"><Input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} className="rounded-xl" /></Field>
            <Field label="Trial Days"><Input type="number" value={form.trial_days} onChange={(e) => set("trial_days", Number(e.target.value))} className="rounded-xl" /></Field>
          </div>
        </Section>

        {/* Pricing Matrix */}
        <Section title="Pricing (per currency)">
          <p className="text-xs text-muted-foreground mb-3">Set independent prices for each currency. No auto-conversion.</p>
          <div className="space-y-3">
            {BILLING_PERIODS.map(bp => {
              const data = form.billing_periods[bp.id] || { enabled: false, prices: {} };
              return (
                <div key={bp.id} className={`rounded-xl border p-3 ${data.enabled ? "border-[#4F7CFF]/30 bg-[#4F7CFF]/5" : "border-gray-100 dark:border-gray-800"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">{bp.label}</label>
                    <button onClick={() => setBP(bp.id, "enabled", !data.enabled)} className={`relative w-10 h-6 rounded-full transition-colors ${data.enabled ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${data.enabled ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                  {data.enabled && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {currencies.filter(c => c.enabled).map(c => (
                        <div key={c.code} className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground w-10">{c.code}</span>
                          <Input type="number" min="0" value={data.prices?.[c.code] || 0} onChange={(e) => setPrice(bp.id, c.code, e.target.value)} className="rounded-lg h-8 text-sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Features */}
        <Section title="Features">
          <div className="space-y-2">
            {Object.entries(form.features).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-1.5 rounded-lg bg-accent flex-1 truncate">{key}</span>
                <Input value={String(val)} onChange={(e) => updateFeatureVal(key, e.target.value)} className="rounded-lg h-8 text-sm flex-1" placeholder="value (true, 10, 1GB...)" />
                <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444] shrink-0" onClick={() => removeFeature(key)}><X className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Select value={newFeatureKey} onValueChange={setNewFeatureKey}>
              <SelectTrigger className="rounded-lg h-8 text-sm flex-1"><SelectValue placeholder="Select or type feature..." /></SelectTrigger>
              <SelectContent>{COMMON_FEATURES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={newFeatureVal} onChange={(e) => setNewFeatureVal(e.target.value)} className="rounded-lg h-8 text-sm flex-1" placeholder="value" />
            <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={addFeature}><Plus className="w-4 h-4 mr-1" />Add</Button>
          </div>
        </Section>

        {/* Display Features List */}
        <Section title="Display Features (pricing card)">
          <Textarea value={form.feature_list.join("\n")} onChange={(e) => set("feature_list", e.target.value.split("\n").filter(l => l.trim()))} rows={4} className="rounded-xl resize-none text-sm" placeholder="One feature per line..." />
        </Section>

        {/* Display Settings */}
        <Section title="Display Settings">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text"><Input value={form.button_text} onChange={(e) => set("button_text", e.target.value)} className="rounded-xl" /></Field>
            <Field label="Accent Color"><Input type="color" value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="rounded-xl h-9 p-1" /></Field>
            <Field label="Ribbon Text"><Input value={form.ribbon_text} onChange={(e) => set("ribbon_text", e.target.value)} className="rounded-xl" placeholder="Best Value" /></Field>
            <Field label="Badge Text"><Input value={form.badge_text} onChange={(e) => set("badge_text", e.target.value)} className="rounded-xl" placeholder="Popular" /></Field>
          </div>
        </Section>

        {/* Live Preview */}
        <Section title="Live Preview">
          <div className="rounded-2xl border-2 p-5" style={{ borderColor: form.accent_color }}>
            {form.badge_text && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block text-white" style={{ backgroundColor: form.accent_color }}>{form.badge_text}</span>}
            <p className="font-bold text-lg">{form.name || "Plan Name"}</p>
            <p className="text-xs text-muted-foreground mb-2">{form.description}</p>
            {defaultCurrency && <p className="text-2xl font-bold mb-3">{formatPrice(getPlanPrice(form, defaultCurrency.code, "monthly"), defaultCurrency)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>}
            <ul className="text-xs space-y-1 mb-3">
              {form.feature_list.slice(0, 5).map((f, i) => <li key={i} className="flex items-center gap-1"><Check className="w-3 h-3 text-[#22C55E]" />{f}</li>)}
            </ul>
            <div className="text-white text-sm font-medium px-4 py-2 rounded-xl text-center" style={{ backgroundColor: form.accent_color }}>{form.button_text}</div>
          </div>
        </Section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="bg-gradient-primary text-white" disabled={saving} onClick={save}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{plan ? "Save Changes" : "Create Plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);
const Field = ({ label, children, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="text-xs font-medium block mb-1">{label}</label>
    {children}
  </div>
);