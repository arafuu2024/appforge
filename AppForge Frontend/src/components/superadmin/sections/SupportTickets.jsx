import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader, SearchBar, EmptyState, Spinner } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { timeAgo } from "@/lib/format";
import { LifeBuoy, Trash2, Eye, Loader2, Send } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUS_STYLE = {
  open: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  in_progress: "bg-[#F59E0B]/10 text-[#F59E0B]",
  resolved: "bg-[#22C55E]/10 text-[#22C55E]",
  closed: "bg-gray-100 text-gray-500 dark:bg-gray-800",
};
const PRIORITY_STYLE = {
  low: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  medium: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  high: "bg-[#F59E0B]/10 text-[#F59E0B]",
  urgent: "bg-[#EF4444]/10 text-[#EF4444]",
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const { toast } = useToast();

  const load = () => {
    base44.entities.SupportTicket.list("-created_date")
      .then(setTickets)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t =>
    (t.subject || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.user_email || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateTicket = async (ticket, patch, msg) => {
    setBusy(ticket.id);
    try {
      await base44.entities.SupportTicket.update(ticket.id, patch);
      await logAudit({ action: "ticket.update", targetType: "ticket", targetId: ticket.id, details: msg });
      if (patch.reply) {
        await base44.entities.Notification.create({
          title: "Support Ticket Update",
          message: `Your ticket "${ticket.subject}" has been updated.`,
          type: "system",
          user_id: ticket.created_by_id,
          read: false,
        }).catch(() => {});
      }
      toast({ title: "Updated", description: msg });
      load();
    } catch {
      toast({ title: "Error", description: "Could not update ticket.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Support Tickets" desc="View, reply, assign, and manage support tickets" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by subject or email..." />

      {filtered.length === 0 ? (
        <EmptyState label="tickets" icon={LifeBuoy} />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center shrink-0"><LifeBuoy className="w-4 h-4 text-[#4F7CFF]" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{t.user_email} · {timeAgo(t.created_date)}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${PRIORITY_STYLE[t.priority] || ""}`}>{t.priority}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[t.status] || ""}`}>{t.status.replace("_", " ")}</span>
              <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" onClick={() => { setDetail(t); setReply(""); setNewStatus(t.status); setNewPriority(t.priority); }} title="View & reply"><Eye className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.subject}</DialogTitle><DialogDescription>{detail?.user_email} · {timeAgo(detail?.created_date)}</DialogDescription></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="rounded-xl bg-accent p-4 text-sm">{detail.message}</div>
              {detail.reply && (
                <div className="rounded-xl bg-[#4F7CFF]/5 p-4 text-sm border border-[#4F7CFF]/10">
                  <p className="text-xs font-semibold text-[#4F7CFF] mb-1">Admin Reply</p>
                  {detail.reply}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reply</label>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Type your reply..." className="mt-1 rounded-xl resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
            <Button className="bg-gradient-primary text-white" disabled={busy === detail?.id} onClick={async () => {
              const patch = { status: newStatus, priority: newPriority };
              if (reply.trim()) patch.reply = reply.trim();
              await updateTicket(detail, patch, `Ticket "${detail.subject}" updated to ${newStatus}`);
              setDetail(null);
            }}>
              {busy === detail?.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Save & Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}