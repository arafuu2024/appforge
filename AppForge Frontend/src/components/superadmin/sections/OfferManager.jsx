import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader, SearchBar, EmptyState, ConfirmDialog, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { Tag, Plus, Edit3, Trash2, Pause, Play, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const OFFER_TYPES = ["percentage", "fixed", "special_price", "bogo", "upgrade", "renewal", "coupon", "automatic"];
const STATUS_STYLE = {
  active: "bg-[#22C55E]/10 text-[#22C55E]",
  paused: "bg-[#F59E0B]/10 text-[#F59E0B]",
  expired: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  scheduled: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
};

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const load = () => { base44.entities.Offer.list("-created_date").then(setOffers).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = offers.filter(o => (o.name || "").toLowerCase().includes(search.toLowerCase()) || (o.coupon_code || "").toLowerCase().includes(search.toLowerCase()));

  const togglePause = async (o) => {
    setBusy(o.id);
    const newStatus = o.status === "active" ? "paused" : "active";
    try {
      await base44.entities.Offer.update(o.id, { status: newStatus });
      await logAudit({ action: `offer.${newStatus === "active" ? "resume" : "pause"}`, targetType: "offer", targetId: o.id, details: `${o.name} → ${newStatus}` });
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const del = async () => {
    setBusy(confirm.id);
    try {
      await base44.entities.Offer.delete(confirm.id);
      await logAudit({ action: "offer.delete", targetType: "offer", targetId: confirm.id, details: `Deleted ${confirm.name}` });
      toast({ title: "Deleted", description: `${confirm.name} has been removed.` });
      setConfirm(null);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Offers & Coupons" desc="Create discounts, schedule sales, and manage coupon codes"
        action={<Button className="bg-gradient-primary text-white rounded-xl" onClick={() => setEditor({})}><Plus className="w-4 h-4 mr-2" />Create Offer</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search offers or coupon codes..." />

      {filtered.length === 0 ? (
        <EmptyState label="offers" icon={Tag} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center shrink-0"><Tag className="w-4 h-4 text-[#7C3AED]" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{o.name} {o.coupon_code && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-accent ml-1">{o.coupon_code}</span>}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {o.type.replace("_", " ")} · {o.value > 0 ? (o.type === "percentage" ? `${o.value}%` : o.value) : ""}
                  {o.start_date && ` · ${new Date(o.start_date).toLocaleDateString()} → ${o.end_date ? new Date(o.end_date).toLocaleDateString() : "ongoing"}`}
                </p>
              </div>
              {o.has_countdown && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] shrink-0 hidden sm:block">TIMER</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[o.status] || ""}`}>{o.status}</span>
              <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" disabled={busy === o.id} onClick={() => togglePause(o)} title={o.status === "active" ? "Pause" : "Resume"}>{o.status === "active" ? <Pause className="w-4 h-4 text-[#F59E0B]" /> : <Play className="w-4 h-4 text-[#22C55E]" />}</Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" onClick={() => setEditor(o)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444] shrink-0" onClick={() => setConfirm(o)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {editor && <OfferEditor offer={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Delete Offer" description={`This will permanently delete "${confirm?.name}".`} confirmLabel="Delete" destructive busy={busy === confirm?.id} onConfirm={del} />
    </div>
  );
}

function OfferEditor({ offer, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(offer || {
      name: "", description: "", type: "percentage", value: 0, coupon_code: "", status: "active",
      start_date: "", end_date: "", timezone: "UTC", banner_text: "", banner_color: "#4F7CFF",
      max_uses: 0, per_user_limit: 0, used_count: 0, applicable_plans: [], applicable_currencies: [],
      applicable_countries: [], has_countdown: false, animation_enabled: false,
    });
  }, [offer]);

  if (!form) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (!form.name.trim()) { toast({ title: "Validation", description: "Offer name is required.", variant: "warning" }); return false; }
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) { toast({ title: "Validation", description: "End date must be after start date.", variant: "warning" }); return false; }
    if (form.type === "coupon" && !form.coupon_code.trim()) { toast({ title: "Validation", description: "Coupon code is required for coupon type.", variant: "warning" }); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const payload = { ...form, created_by_email: me?.email || "" };
      if (offer) {
        await base44.entities.Offer.update(offer.id, payload);
        await logAudit({ action: "offer.update", targetType: "offer", targetId: offer.id, details: `Updated ${form.name}` });
        toast({ title: "Saved", description: `${form.name} has been updated.` });
      } else {
        const created = await base44.entities.Offer.create(payload);
        await logAudit({ action: "offer.create", targetType: "offer", targetId: created.id, details: `Created ${form.name}` });
        toast({ title: "Created", description: `${form.name} has been created.` });
      }
      onSaved();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{offer ? "Edit Offer" : "Create Offer"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs font-medium block mb-1">Name</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Type</label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OFFER_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-xs font-medium block mb-1">Value</label><Input type="number" min="0" value={form.value} onChange={(e) => set("value", Number(e.target.value))} className="rounded-xl" placeholder="percentage or amount" /></div>
          {form.type === "coupon" && <div className="col-span-2"><label className="text-xs font-medium block mb-1">Coupon Code</label><Input value={form.coupon_code} onChange={(e) => set("coupon_code", e.target.value.toUpperCase())} className="rounded-xl font-mono" placeholder="SUMMER20" /></div>}
          <div><label className="text-xs font-medium block mb-1">Start Date</label><Input type="datetime-local" value={form.start_date ? form.start_date.slice(0, 16) : ""} onChange={(e) => set("start_date", e.target.value ? new Date(e.target.value).toISOString() : "")} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">End Date</label><Input type="datetime-local" value={form.end_date ? form.end_date.slice(0, 16) : ""} onChange={(e) => set("end_date", e.target.value ? new Date(e.target.value).toISOString() : "")} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Max Uses (0=unlimited)</label><Input type="number" min="0" value={form.max_uses} onChange={(e) => set("max_uses", Number(e.target.value))} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Per User Limit</label><Input type="number" min="0" value={form.per_user_limit} onChange={(e) => set("per_user_limit", Number(e.target.value))} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Banner Text</label><Input value={form.banner_text} onChange={(e) => set("banner_text", e.target.value)} className="rounded-xl" placeholder="Summer Sale!" /></div>
          <div><label className="text-xs font-medium block mb-1">Banner Color</label><Input type="color" value={form.banner_color} onChange={(e) => set("banner_color", e.target.value)} className="rounded-xl h-9 p-1" /></div>
          <div><label className="text-xs font-medium block mb-1">Applicable Plans (comma-separated)</label><Input value={(form.applicable_plans || []).join(", ")} onChange={(e) => set("applicable_plans", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="rounded-xl" placeholder="starter, professional" /></div>
          <div><label className="text-xs font-medium block mb-1">Applicable Currencies</label><Input value={(form.applicable_currencies || []).join(", ")} onChange={(e) => set("applicable_currencies", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="rounded-xl" placeholder="USD, BDT" /></div>
          <div className="col-span-2 flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_countdown} onChange={(e) => set("has_countdown", e.target.checked)} />Countdown Timer</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.animation_enabled} onChange={(e) => set("animation_enabled", e.target.checked)} />Animation</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="bg-gradient-primary text-white" disabled={saving} onClick={save}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{offer ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}