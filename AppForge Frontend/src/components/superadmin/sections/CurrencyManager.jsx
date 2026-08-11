import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader, EmptyState, ConfirmDialog, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { Globe, Plus, Edit3, Trash2, Star, ArrowUp, ArrowDown, Check, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export default function CurrencyManager() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const load = () => { base44.entities.Currency.list().then(setCurrencies).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const sorted = [...currencies].sort((a, b) => (a.order || 0) - (b.order || 0));

  const toggle = async (c) => {
    setBusy(c.id);
    try {
      await base44.entities.Currency.update(c.id, { enabled: !c.enabled });
      await logAudit({ action: "currency.toggle", targetType: "currency", targetId: c.id, details: `${c.code} ${c.enabled ? "disabled" : "enabled"}` });
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const setDefault = async (c) => {
    setBusy(c.id);
    try {
      for (const cur of currencies) {
        if (cur.is_default && cur.id !== c.id) await base44.entities.Currency.update(cur.id, { is_default: false });
      }
      await base44.entities.Currency.update(c.id, { is_default: true, enabled: true });
      await logAudit({ action: "currency.default", targetType: "currency", targetId: c.id, details: `Default currency → ${c.code}` });
      toast({ title: "Default set", description: `${c.code} is now the default currency.` });
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const reorder = async (c, dir) => {
    setBusy(c.id);
    const idx = sorted.findIndex(x => x.id === c.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) { setBusy(null); return; }
    const other = sorted[swapIdx];
    try {
      await Promise.all([
        base44.entities.Currency.update(c.id, { order: other.order }),
        base44.entities.Currency.update(other.id, { order: c.order }),
      ]);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const del = async () => {
    setBusy(confirm.id);
    try {
      await base44.entities.Currency.delete(confirm.id);
      await logAudit({ action: "currency.delete", targetType: "currency", targetId: confirm.id, details: `Deleted ${confirm.code}` });
      toast({ title: "Deleted", description: `${confirm.code} has been removed.` });
      setConfirm(null);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Currency Manager" desc="Enable, disable, reorder, and configure currencies for regional pricing"
        action={<Button className="bg-gradient-primary text-white rounded-xl" onClick={() => setEditor({})}><Plus className="w-4 h-4 mr-2" />Add Currency</Button>} />

      {sorted.length === 0 ? (
        <EmptyState label="currencies" icon={Globe} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {sorted.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="flex flex-col gap-0.5">
                <Button size="icon" variant="ghost" className="w-6 h-6" disabled={busy === c.id || i === 0} onClick={() => reorder(c, "up")}><ArrowUp className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="w-6 h-6" disabled={busy === c.id || i === sorted.length - 1} onClick={() => reorder(c, "down")}><ArrowDown className="w-3 h-3" /></Button>
              </div>
              <div className="w-12 h-10 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center font-bold text-sm shrink-0">{c.symbol}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.code} {c.is_default && <Star className="w-3 h-3 inline text-[#F59E0B] fill-[#F59E0B] ml-1" />}</p>
                <p className="text-xs text-muted-foreground">{c.name} · {c.position} · {c.decimals} decimals</p>
              </div>
              <button onClick={() => toggle(c)} disabled={busy === c.id} className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${c.enabled ? "bg-[#22C55E]" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${c.enabled ? "translate-x-4" : ""}`} />
              </button>
              {!c.is_default && <Button size="icon" variant="ghost" className="w-8 h-8" disabled={busy === c.id || !c.enabled} onClick={() => setDefault(c)} title="Set default"><Star className="w-4 h-4" /></Button>}
              {c.is_default && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] shrink-0">DEFAULT</span>}
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditor(c)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444]" onClick={() => setConfirm(c)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {editor && <CurrencyEditor currency={editor.id ? editor : null} currencies={currencies} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Delete Currency" description={`This will remove ${confirm?.code} and all its regional pricing. This cannot be undone.`} confirmLabel="Delete" destructive busy={busy === confirm?.id} onConfirm={del} />
    </div>
  );
}

function CurrencyEditor({ currency, currencies, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(currency || { code: "", symbol: "", name: "", enabled: true, is_default: false, order: 0, decimals: 2, position: "before", countries: [] });
  }, [currency]);

  if (!form) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.code.trim() || !form.symbol.trim() || !form.name.trim()) { toast({ title: "Validation", description: "Code, symbol, and name are required.", variant: "warning" }); return; }
    if (!currency && currencies.some(c => c.code.toUpperCase() === form.code.toUpperCase())) { toast({ title: "Validation", description: "Currency code already exists.", variant: "warning" }); return; }
    setSaving(true);
    try {
      if (currency) {
        await base44.entities.Currency.update(currency.id, form);
        await logAudit({ action: "currency.update", targetType: "currency", targetId: currency.id, details: `Updated ${form.code}` });
        toast({ title: "Saved", description: `${form.code} has been updated.` });
      } else {
        const created = await base44.entities.Currency.create({ ...form, code: form.code.toUpperCase() });
        await logAudit({ action: "currency.create", targetType: "currency", targetId: created.id, details: `Created ${form.code}` });
        toast({ title: "Created", description: `${form.code} has been added.` });
      }
      onSaved();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{currency ? "Edit Currency" : "Add Currency"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium block mb-1">Code</label><Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="rounded-xl" placeholder="USD" maxLength={4} /></div>
          <div><label className="text-xs font-medium block mb-1">Symbol</label><Input value={form.symbol} onChange={(e) => set("symbol", e.target.value)} className="rounded-xl" placeholder="$" /></div>
          <div className="col-span-2"><label className="text-xs font-medium block mb-1">Name</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-xl" placeholder="US Dollar" /></div>
          <div><label className="text-xs font-medium block mb-1">Decimals</label><Input type="number" min="0" max="4" value={form.decimals} onChange={(e) => set("decimals", Number(e.target.value))} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Position</label>
            <select value={form.position} onChange={(e) => set("position", e.target.value)} className="h-10 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm w-full">
              <option value="before">Before Amount ($9)</option>
              <option value="after">After Amount (9 $)</option>
            </select>
          </div>
          <div><label className="text-xs font-medium block mb-1">Order</label><Input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} className="rounded-xl" /></div>
          <div><label className="text-xs font-medium block mb-1">Countries (comma-separated)</label><Input value={(form.countries || []).join(", ")} onChange={(e) => set("countries", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="rounded-xl" placeholder="US, CA" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="bg-gradient-primary text-white" disabled={saving} onClick={save}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{currency ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}