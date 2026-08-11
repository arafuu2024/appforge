import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SectionHeader, SearchBar, EmptyState, ConfirmDialog } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { PLANS, PLAN_ORDER, getCurrentPlanId } from "@/lib/plans";
import { timeAgo } from "@/lib/format";
import {
  MailCheck, UserCog, Trash2, Crown, Eye, Loader2, RotateCcw,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [newSub, setNewSub] = useState("free");
  const { toast } = useToast();

  const load = () => {
    base44.entities.User.list("-created_date")
      .then(setUsers)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const act = async (user, patch, action, msg, notifMsg) => {
    setBusy(user.id);
    try {
      await base44.entities.User.update(user.id, patch);
      await logAudit({ action, targetType: "user", targetId: user.id, details: msg });
      if (notifMsg) {
        await base44.entities.Notification.create({
          title: "Account Update",
          message: notifMsg,
          type: "system",
          user_id: user.id,
          read: false,
        }).catch(() => {});
      }
      toast({ title: "Success", description: msg });
      load();
    } catch {
      toast({ title: "Error", description: "Action failed.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="User Management" desc="Search, suspend, ban, verify, and manage user roles & subscriptions" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email..." />

      {filtered.length === 0 ? (
        <EmptyState label="users" icon={Eye} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.map(u => {
            const planId = getCurrentPlanId(u);
            return (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {(u.full_name || u.email)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {u.disabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">SUSPENDED</span>}
                  {u.is_verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">VERIFIED</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent capitalize">{u.role || "user"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">{PLANS[planId]?.name || "Free"}</span>
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setDetail(u)} title="View"><Eye className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8" disabled={busy === u.id} onClick={() => act(u, { is_verified: !u.is_verified }, "user.verify", `${u.is_verified ? "Unverified" : "Verified"} ${u.email}`, `Your email has been ${u.is_verified ? "unverified" : "verified"}.`)} title={u.is_verified ? "Unverify" : "Verify email"}><MailCheck className={`w-4 h-4 ${u.is_verified ? "text-[#22C55E]" : "text-muted-foreground"}`} /></Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8" disabled={busy === u.id} onClick={() => act(u, { disabled: !u.disabled }, "user.suspend", `${u.disabled ? "Restored" : "Suspended"} ${u.email}`, `Your account has been ${u.disabled ? "restored" : "suspended"}.`)} title={u.disabled ? "Restore" : "Suspend"}>{u.disabled ? <RotateCcw className="w-4 h-4 text-[#22C55E]" /> : <UserCog className="w-4 h-4 text-[#F59E0B]" />}</Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => { setEditSub(u); setNewSub(planId); }} title="Change subscription"><Crown className="w-4 h-4 text-[#F59E0B]" /></Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-[#EF4444]" onClick={() => setConfirm(u)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle><DialogDescription>{detail?.email}</DialogDescription></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <DetailRow label="Name" value={detail.full_name || "—"} />
              <DetailRow label="Email" value={detail.email} />
              <DetailRow label="Role" value={detail.role || "user"} />
              <DetailRow label="Subscription" value={PLANS[getCurrentPlanId(detail)]?.name || "Free"} />
              <DetailRow label="Disabled" value={detail.disabled ? "Yes" : "No"} />
              <DetailRow label="Email Verified" value={detail.is_verified ? "Yes" : "No"} />
              <DetailRow label="Joined" value={timeAgo(detail.created_date)} />
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit subscription dialog */}
      <Dialog open={!!editSub} onOpenChange={(o) => !o && setEditSub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Subscription</DialogTitle><DialogDescription>{editSub?.email}</DialogDescription></DialogHeader>
          <Select value={newSub} onValueChange={setNewSub}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLAN_ORDER.map(id => <SelectItem key={id} value={id}>{PLANS[id].name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Cancel</Button>
            <Button className="bg-gradient-primary text-white" disabled={busy === editSub?.id} onClick={async () => {
              await act(editSub, { subscription: newSub }, "user.subscription", `Changed ${editSub.email} subscription to ${PLANS[newSub]?.name}`, `Your subscription has been changed to ${PLANS[newSub]?.name}.`);
              setEditSub(null);
            }}>{busy === editSub?.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete User"
        description={`This will permanently delete ${confirm?.email}. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        busy={busy === confirm?.id}
        onConfirm={async () => {
          setBusy(confirm.id);
          try {
            await base44.entities.User.delete(confirm.id);
            await logAudit({ action: "user.delete", targetType: "user", targetId: confirm.id, details: `Deleted ${confirm.email}` });
            toast({ title: "Deleted", description: `${confirm.email} has been removed.` });
            setConfirm(null);
            load();
          } catch {
            toast({ title: "Error", description: "Could not delete user (platform users may be protected).", variant: "destructive" });
          } finally { setBusy(null); }
        }}
      />
    </div>
  );
}

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
);