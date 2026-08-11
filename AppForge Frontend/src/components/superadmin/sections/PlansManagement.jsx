import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SectionHeader, SearchBar, EmptyState, ConfirmDialog, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { getPlanPrice, formatPrice, BILLING_PERIODS } from "@/lib/dynamicPricing";
import { Crown, Plus, Edit3, Copy, Archive, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import PlanEditor from "@/components/superadmin/sections/PlanEditor";

const STATUS_STYLE = {
  active: "bg-[#22C55E]/10 text-[#22C55E]",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  draft: "bg-[#F59E0B]/10 text-[#F59E0B]",
};
const VIS_STYLE = {
  visible: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  hidden: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  featured: "bg-[#7C3AED]/10 text-[#7C3AED]",
  popular: "bg-[#F59E0B]/10 text-[#F59E0B]",
  recommended: "bg-[#22C55E]/10 text-[#22C55E]",
  coming_soon: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  limited_offer: "bg-[#EF4444]/10 text-[#EF4444]",
  beta: "bg-[#7C3AED]/10 text-[#7C3AED]",
};

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const load = () => {
    Promise.all([
      base44.entities.Plan.list().catch(() => []),
      base44.entities.Currency.list().catch(() => []),
    ]).then(([p, c]) => { setPlans(p); setCurrencies(c); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = plans.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.internal_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const duplicate = async (plan) => {
    setBusy(plan.id);
    try {
      const { id, created_date, updated_date, created_by_email, ...rest } = plan;
      await base44.entities.Plan.create({ ...rest, name: `${plan.name} (Copy)`, internal_id: `${plan.internal_id}_copy`, order: (plan.order || 0) + 1, status: "draft" });
      await logAudit({ action: "plan.duplicate", targetType: "plan", details: `Duplicated ${plan.name}` });
      toast({ title: "Duplicated", description: `${plan.name} has been duplicated as draft.` });
      load();
    } catch { toast({ title: "Error", description: "Could not duplicate plan.", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const toggleStatus = async (plan) => {
    setBusy(plan.id);
    const newStatus = plan.status === "active" ? "archived" : "active";
    try {
      await base44.entities.Plan.update(plan.id, { status: newStatus });
      await logAudit({ action: `plan.${newStatus === "active" ? "activate" : "archive"}`, targetType: "plan", targetId: plan.id, details: `${plan.name} → ${newStatus}` });
      toast({ title: newStatus === "active" ? "Activated" : "Archived", description: `${plan.name} is now ${newStatus}.` });
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const del = async () => {
    setBusy(confirm.id);
    try {
      await base44.entities.Plan.delete(confirm.id);
      await logAudit({ action: "plan.delete", targetType: "plan", targetId: confirm.id, details: `Deleted ${confirm.name}` });
      toast({ title: "Deleted", description: `${confirm.name} has been removed.` });
      setConfirm(null);
      load();
    } catch { toast({ title: "Error", description: "Could not delete plan.", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Plans & Pricing" desc="Create, edit, and manage all subscription plans with per-currency pricing"
        action={<Button className="bg-gradient-primary text-white rounded-xl" onClick={() => setEditor({})}><Plus className="w-4 h-4 mr-2" />Create Plan</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search plans..." />

      {filtered.length === 0 ? (
        <EmptyState label="plans" icon={Crown} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.internal_id}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] || ""}`}>{p.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VIS_STYLE[p.visibility] || ""}`}>{p.visibility.replace("_", " ")}</span>
                {defaultCurrency && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">{formatPrice(getPlanPrice(p, defaultCurrency.code, "monthly"), defaultCurrency)}/mo</span>}
              </div>
              {p.feature_list && p.feature_list.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 mb-3 line-clamp-3">
                  {p.feature_list.slice(0, 3).map((f, i) => <li key={i} className="truncate">• {f}</li>)}
                </ul>
              )}
              <div className="flex gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditor(p)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" disabled={busy === p.id} onClick={() => duplicate(p)} title="Duplicate"><Copy className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" disabled={busy === p.id} onClick={() => toggleStatus(p)} title={p.status === "active" ? "Archive" : "Activate"}>{p.status === "active" ? <Archive className="w-4 h-4 text-[#F59E0B]" /> : <Eye className="w-4 h-4 text-[#22C55E]" />}</Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444]" onClick={() => setConfirm(p)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && <PlanEditor plan={editor.id ? editor : null} currencies={currencies} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Delete Plan" description={`This will permanently delete "${confirm?.name}". This action cannot be undone.`} confirmLabel="Delete" destructive busy={busy === confirm?.id} onConfirm={del} />
    </div>
  );
}