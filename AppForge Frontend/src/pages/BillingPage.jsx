import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { PLANS, getCurrentPlanId } from "@/lib/plans";
import { Crown, Clock, CheckCircle2, XCircle, CreditCard, RefreshCw } from "lucide-react";

const METHOD_LABEL = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket" };
const STATUS_STYLE = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B]",
  approved: "bg-[#22C55E]/10 text-[#22C55E]",
  rejected: "bg-[#EF4444]/10 text-[#EF4444]",
};

const RequestRow = ({ r, showReason }) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-accent min-w-0">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium truncate">{PLANS[r.plan]?.name || r.plan} · {METHOD_LABEL[r.payment_method] || r.payment_method}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">
        ৳{(r.amount || 0).toLocaleString()} · Txn {r.transaction_id} · {r.created_date ? new Date(r.created_date).toLocaleDateString() : ""}
      </p>
      {showReason && r.rejection_reason && <p className="text-xs text-[#EF4444] mt-1 truncate">Reason: {r.rejection_reason}</p>}
    </div>
  </div>
);

const ListCard = ({ title, icon: Icon, color, empty, rows, showReason }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="font-semibold">{title}</h3>
    </div>
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>
    ) : (
      <div className="space-y-2">
        {rows.map((r) => <RequestRow key={r.id} r={r} showReason={showReason} />)}
      </div>
    )}
  </motion.div>
);

export default function BillingPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PaymentRequest.list("-created_date")
      .then((all) => setRequests(all.filter((r) => r.created_by_id === user?.id || r.email === user?.email)))
      .finally(() => setLoading(false));
  }, [user?.id, user?.email]);

  const currentId = getCurrentPlanId(user);
  const currentPlan = PLANS[currentId];
  const isPaid = currentId !== "free";
  const approved = requests.filter((r) => r.status === "approved");
  const pending = requests.filter((r) => r.status === "pending");
  const rejected = requests.filter((r) => r.status === "rejected");

  if (loading) {
    return <div className="max-w-4xl space-y-6"><div className="h-8 w-40 bg-accent rounded-lg animate-pulse" /><div className="h-40 rounded-2xl bg-accent animate-pulse" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {/* Current plan + status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#7C3AED] p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/70 mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold">{currentPlan.name} Plan</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/15">
                {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isPaid ? "Active subscription" : "Free tier"}
              </span>
              <span className="text-xs text-white/70">
                {currentPlan.projects === Infinity ? "Unlimited" : currentPlan.projects} projects · {currentPlan.buildsPerMonth === Infinity ? "Unlimited" : currentPlan.buildsPerMonth} builds/mo
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isPaid ? (
              <Link to="/payment">
                <Button className="bg-white text-[#4F7CFF] hover:bg-white/90 font-semibold rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" />Renew
                </Button>
              </Link>
            ) : (
              <Link to="/upgrade-plan">
                <Button className="bg-white text-[#4F7CFF] hover:bg-white/90 font-semibold rounded-xl">
                  <Crown className="w-4 h-4 mr-2" />Upgrade
                </Button>
              </Link>
            )}
            <Link to="/upgrade-plan">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl">Plans</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <ListCard title="Pending Requests" icon={Clock} color="#F59E0B" empty="No pending requests" rows={pending} />
      <ListCard title="Rejected Requests" icon={XCircle} color="#EF4444" empty="No rejected requests" rows={rejected} showReason />
      <ListCard title="Payment History" icon={CreditCard} color="#22C55E" empty="No payments yet" rows={approved} />

      {/* Upgrade CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">Upgrade or Renew</h3>
          <p className="text-sm text-muted-foreground">Pay via bKash, Nagad or Rocket with manual verification.</p>
        </div>
        <Link to="/upgrade-plan">
          <Button className="bg-gradient-primary text-white rounded-xl"><Crown className="w-4 h-4 mr-2" />View Plans</Button>
        </Link>
      </motion.div>
    </div>
  );
}