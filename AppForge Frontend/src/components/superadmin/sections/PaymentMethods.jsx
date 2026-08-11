import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader, EmptyState, ConfirmDialog, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { CreditCard, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const load = () => {
    Promise.all([
      base44.entities.PaymentMethod.list().catch(() => []),
      base44.entities.Currency.list().catch(() => []),
    ]).then(([m, c]) => { setMethods(m); setCurrencies(c); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const enabledCurrencies = currencies.filter(c => c.enabled).sort((a, b) => (a.order || 0) - (b.order || 0));
  const grouped = {};
  enabledCurrencies.forEach(c => { grouped[c.code] = methods.filter(m => m.currency_code === c.code).sort((a, b) => (a.order || 0) - (b.order || 0)); });

  const toggle = async (m) => {
    setBusy(m.id);
    try { await base44.entities.PaymentMethod.update(m.id, { enabled: !m.enabled }); load(); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const reorder = async (m, dir, list) => {
    setBusy(m.id);
    const idx = list.findIndex(x => x.id === m.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) { setBusy(null); return; }
    const other = list[swapIdx];
    try {
      await Promise.all([
        base44.entities.PaymentMethod.update(m.id, { order: other.order }),
        base44.entities.PaymentMethod.update(other.id, { order: m.order }),
      ]);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const del = async () => {
    setBusy(confirm.id);
    try {
      await base44.entities.PaymentMethod.delete(confirm.id);
      await logAudit({ action: "payment_method.delete", targetType: "payment_method", targetId: confirm.id, details: `Deleted ${confirm.name}` });
      toast({ title: "Deleted" });
      setConfirm(null);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Payment Methods" desc="Configure payment methods per currency with instructions, QR codes, and logos"
        action={<Button className="bg-gradient-primary text-white rounded-xl" onClick={() => setEditor({})}><Plus className="w-4 h-4 mr-2" />Add Method</Button>} />

      {enabledCurrencies.length === 0 ? (
        <EmptyState label="currencies — add currencies first" icon={CreditCard} />
      ) : (
        <div className="space-y-4">
          {enabledCurrencies.map(c => (
            <div key={c.code} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 bg-accent flex items-center gap-2">
                <span className="font-bold text-lg">{c.symbol}</span>
                <span className="text-sm font-medium">{c.code}</span>
                <span className="text-xs text-muted-foreground">— {c.name}</span>
              </div>
              {(grouped[c.code] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground p-4">No payment methods for this currency.</p>
              ) : grouped[c.code].map((m, i, list) => (
                <div key={m.id} className="flex items-center gap-3 p-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" className="w-6 h-6" disabled={busy === m.id || i === 0} onClick={() => reorder(m, "up", list)}><ArrowUp className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="w-6 h-6" disabled={busy === m.id || i === list.length - 1} onClick={() => reorder(m, "down", list)}><ArrowDown className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.display_name || m.name}</p>
                    {m.instructions && <p className="text-xs text-muted-foreground truncate">{m.instructions}</p>}
                  </div>
                  <button onClick={() => toggle(m)} disabled={busy === m.id} className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${m.enabled ? "bg-[#22C55E]" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${m.enabled ? "translate-x-4" : ""}`} />
                  </button>
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditor(m)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444]" onClick={() => setConfirm(m)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editor && <PaymentMethodEditor method={editor.id ? editor : null} currencies={enabledCurrencies} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Delete Payment Method" description={`This will remove "${confirm?.name}".`} confirmLabel="Delete" destructive busy={busy === confirm?.id} onConfirm={del} />
    </div>
  );
}

function PaymentMethodEditor({ method, currencies, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(method || { name: "", display_name: "", currency_code: currencies[0]?.code || "", enabled: true, order: 0, instructions: "", qr_code_url: "", logo_url: "", account_details: "" });
  }, [method]);

  if (!form) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.currency_code) { toast({ title: "Validation", description: "Name and currency are required.", variant: "warning" }); return; }
    setSaving(true);
    try {
      if (method) {
        await base44.entities.PaymentMethod.update(method.id, form);
        await logAudit({ action: "payment_method.update", targetType: "payment_method", targetId: method.id, details: `Updated ${form.name}` });
        toast({ title: "Saved" });
      } else {
        const created = await base44.entities.PaymentMethod.create(form);
        await logAudit({ action: "payment_method.create", targetType: "payment_method", targetId: created.id, details: `Created ${form.name}` });
        toast({ title: "Created" });
      }
      onSaved();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{method ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium block mb-1">Name (internal)</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-xl" placeholder="bkash, stripe..." /></div>
          <div><label className="text-xs font-medium block mb-1">Display Name</label><Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} className="rounded-xl" placeholder="bKash, Stripe..." /></div>
          <div><label className="text-xs font-medium block mb-1">Currency</label>
            <select value={form.currency_code} onChange={(e) => set("currency_code", e.target.value)} className="h-10 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm w-full">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium block mb-1">Instructions</label><Textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={3} className="rounded-xl resize-none" placeholder="Send money to 01XXXXXXXXX..." /></div>
          <div><label className="text-xs font-medium block mb-1">Account Details</label><Input value={form.account_details} onChange={(e) => set("account_details", e.target.value)} className="rounded-xl" placeholder="Account: 123456789" /></div>
          <div><label className="text-xs font-medium block mb-1">QR Code URL</label><Input value={form.qr_code_url} onChange={(e) => set("qr_code_url", e.target.value)} className="rounded-xl" placeholder="https://..." /></div>
          <div><label className="text-xs font-medium block mb-1">Logo URL</label><Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} className="rounded-xl" placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="bg-gradient-primary text-white" disabled={saving} onClick={save}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{method ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}