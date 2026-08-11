import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PLANS } from "@/lib/plans";
import { CURRENCIES } from "@/lib/currency";
import { Check, X, Eye, Loader2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const METHOD_LABEL = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank_transfer: "Bank Transfer",
  stripe: "Stripe", paypal: "PayPal", credit_card: "Credit Card",
  visa: "Visa", mastercard: "Mastercard", google_pay: "Google Pay", apple_pay: "Apple Pay",
  sepa: "SEPA", upi: "UPI", razorpay: "Razorpay", cards: "Cards",
};
const sym = (code) => CURRENCIES[code]?.symbol || "৳";
const STATUS_STYLE = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B]",
  approved: "bg-[#22C55E]/10 text-[#22C55E]",
  rejected: "bg-[#EF4444]/10 text-[#EF4444]",
};

const Detail = ({ label, value, mono }) => (
  <div className="flex justify-between gap-3 min-w-0">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className={`font-medium text-right truncate ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
);

export default function PaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const load = () => {
    base44.entities.PaymentRequest.list("-created_date")
      .then(setRequests)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const approve = async (req) => {
    setBusy(req.id);
    try {
      await base44.entities.PaymentRequest.update(req.id, { status: "approved" });
      // Upgrade the submitter's subscription (created_by_id is the requesting user)
      if (req.created_by_id) {
        await base44.entities.User.update(req.created_by_id, { subscription: req.plan }).catch(() => {});
      }
      await base44.entities.Notification.create({
        title: "Payment Approved",
        message: `Your ${PLANS[req.plan]?.name || req.plan} plan subscription is now active. Thank you!`,
        type: "payment",
        user_id: req.created_by_id,
        read: false,
      });
      toast({ title: "Approved", description: "User subscription activated." });
      load();
    } catch {
      toast({ title: "Error", description: "Could not approve request.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    setBusy(rejecting.id);
    try {
      await base44.entities.PaymentRequest.update(rejecting.id, {
        status: "rejected",
        rejection_reason: reason.trim(),
      });
      await base44.entities.Notification.create({
        title: "Payment Rejected",
        message: `Your payment request was rejected.${reason.trim() ? ` Reason: ${reason.trim()}` : " Please contact support."}`,
        type: "payment",
        user_id: rejecting.created_by_id,
        read: false,
      });
      toast({ title: "Rejected", description: "User notified." });
      setRejecting(null);
      setReason("");
      load();
    } catch {
      toast({ title: "Error", description: "Could not reject request.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Payment Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify manual payments · bKash · Nagad · Rocket</p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <Wallet className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No payment requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{r.full_name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>Plan: <b className="text-foreground">{PLANS[r.plan]?.name || r.plan}</b></span>
                    <span>Amount: <b className="text-foreground">{sym(r.currency)}{(r.amount || 0).toLocaleString()}</b></span>
                    <span>Method: <b className="text-foreground">{METHOD_LABEL[r.payment_method] || r.payment_method}</b></span>
                    <span className="min-w-0">Txn: <b className="text-foreground font-mono">{r.transaction_id}</b></span>
                    <span>Sender: <b className="text-foreground">{r.sender_mobile}</b></span>
                    <span>Date: <b className="text-foreground">{r.created_date ? new Date(r.created_date).toLocaleDateString() : "—"}</b></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setView(r)}><Eye className="w-3.5 h-3.5 mr-1.5" />View</Button>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" className="rounded-lg bg-[#22C55E] text-white hover:bg-[#22C55E]/90" disabled={busy === r.id} onClick={() => approve(r)}>
                        {busy === r.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-[#EF4444] hover:text-[#EF4444]" disabled={busy === r.id} onClick={() => { setRejecting(r); setReason(""); }}>
                        <X className="w-3.5 h-3.5 mr-1.5" />Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Request Details</DialogTitle>
            <DialogDescription>Submitted {view ? new Date(view.created_date).toLocaleString() : ""}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              <Detail label="User" value={view.full_name} />
              <Detail label="Email" value={view.email} />
              <Detail label="Plan" value={`${PLANS[view.plan]?.name || view.plan} — ${sym(view.currency)}${(view.amount || 0).toLocaleString()}`} />
              <Detail label="Payment Method" value={METHOD_LABEL[view.payment_method] || view.payment_method} />
              <Detail label="Transaction ID" value={view.transaction_id} mono />
              <Detail label="Sender Mobile" value={view.sender_mobile} />
              <Detail label="Note" value={view.note || "—"} />
              <Detail label="Status" value={view.status} />
              {view.status === "rejected" && view.rejection_reason && <Detail label="Rejection Reason" value={view.rejection_reason} />}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setView(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => { if (!o) { setRejecting(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Request</DialogTitle>
            <DialogDescription>The user will be notified with the reason.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for rejection (optional)" className="resize-none" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
            <Button className="bg-[#EF4444] text-white hover:bg-[#EF4444]/90" disabled={busy === rejecting?.id} onClick={confirmReject}>
              {busy === rejecting?.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Reject & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}