import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SectionHeader, SearchBar, EmptyState, ConfirmDialog, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { History, RotateCcw, Loader2 } from "lucide-react";

export default function PriceHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const load = () => { base44.entities.PriceHistory.list("-created_date", 500).then(setHistory).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = history.filter(h =>
    (h.plan_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (h.currency_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const rollback = async () => {
    setBusy(confirm.id);
    try {
      const plan = await base44.entities.Plan.get(confirm.plan_id);
      if (!plan?.billing_periods) { toast({ title: "Error", description: "Plan not found.", variant: "destructive" }); setConfirm(null); return; }
      const bp = { ...plan.billing_periods };
      if (!bp[confirm.billing_period]) bp[confirm.billing_period] = { enabled: true, prices: {} };
      bp[confirm.billing_period].prices = { ...(bp[confirm.billing_period].prices || {}), [confirm.currency_code]: confirm.old_price };
      await base44.entities.Plan.update(plan.id, { billing_periods: bp });
      await base44.entities.PriceHistory.update(confirm.id, { rolled_back: true });
      await logAudit({ action: "price.rollback", targetType: "plan", targetId: confirm.plan_id, details: `Rolled back ${confirm.plan_name} ${confirm.billing_period} ${confirm.currency_code} to ${confirm.old_price}` });
      toast({ title: "Rolled back", description: `${confirm.plan_name} ${confirm.billing_period} ${confirm.currency_code} restored to ${confirm.old_price}.` });
      setConfirm(null);
      load();
    } catch { toast({ title: "Error", description: "Could not rollback price.", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Price History" desc="Track every price change with full audit trail and rollback capability" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by plan or currency..." />

      {filtered.length === 0 ? (
        <EmptyState label="price history" icon={History} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.slice(0, 200).map(h => (
            <div key={h.id} className="flex items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0"><History className="w-4 h-4 text-[#F59E0B]" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{h.plan_name} <span className="text-xs text-muted-foreground">· {h.billing_period} · {h.currency_code}</span></p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="line-through">{h.old_price}</span> → <span className="font-medium text-foreground">{h.new_price}</span>
                  {h.reason && ` · ${h.reason}`}
                  {h.rolled_back && <span className="text-[#22C55E] ml-1">· rolled back</span>}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{new Date(h.created_date).toLocaleDateString()}</span>
              {!h.rolled_back && h.old_price !== h.new_price && (
                <Button size="sm" variant="outline" className="rounded-xl shrink-0" disabled={busy === h.id} onClick={() => setConfirm(h)}><RotateCcw className="w-3.5 h-3.5 mr-1" />Rollback</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Rollback Price" description={`This will restore ${confirm?.plan_name} ${confirm?.billing_period} ${confirm?.currency_code} from ${confirm?.new_price} to ${confirm?.old_price}.`} confirmLabel="Rollback" busy={busy === confirm?.id} onConfirm={rollback} />
    </div>
  );
}