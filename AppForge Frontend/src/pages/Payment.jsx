import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useCurrency } from "@/lib/currency";
import { PLANS, PLAN_ORDER, getCurrentPlanId } from "@/lib/plans";
import { Copy, Check, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

const PAYMENT_NUMBERS = {
  bkash: { label: "bKash (Personal)", number: "01XXXXXXXXX", color: "#E2136E" },
  nagad: { label: "Nagad", number: "01XXXXXXXXX", color: "#EC1C24" },
  rocket: { label: "Rocket", number: "01XXXXXXXXX", color: "#8B2C8B" },
};

const BANK_DETAILS = { label: "Bank Transfer", number: "Bank: Example Bank · A/C: 0000000000000 · Name: AppForge", color: "#2563EB" };

const METHODS_BY_CURRENCY = {
  BDT: [
    { id: "bkash", label: "bKash" },
    { id: "nagad", label: "Nagad" },
    { id: "rocket", label: "Rocket" },
    { id: "bank_transfer", label: "Bank Transfer" },
  ],
  USD: [
    { id: "stripe", label: "Stripe" },
    { id: "paypal", label: "PayPal" },
    { id: "visa", label: "Visa" },
    { id: "mastercard", label: "Mastercard" },
    { id: "google_pay", label: "Google Pay" },
    { id: "apple_pay", label: "Apple Pay" },
  ],
  EUR: [
    { id: "stripe", label: "Stripe" },
    { id: "paypal", label: "PayPal" },
    { id: "sepa", label: "SEPA" },
  ],
  INR: [
    { id: "upi", label: "UPI" },
    { id: "razorpay", label: "Razorpay" },
    { id: "cards", label: "Cards" },
  ],
  GBP: [
    { id: "stripe", label: "Stripe" },
    { id: "paypal", label: "PayPal" },
    { id: "visa", label: "Visa" },
    { id: "mastercard", label: "Mastercard" },
  ],
};

const MOBILE_METHODS = ["bkash", "nagad", "rocket"];

const Field = ({ label, error, children }) => (
  <div className="min-w-0">
    <label className="text-sm font-medium mb-1.5 block">{label}</label>
    {children}
    {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
  </div>
);

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { code, currency, formatPrice } = useCurrency();

  const planParam = searchParams.get("plan");
  const currentId = getCurrentPlanId(user);
  const initialPlan =
    PLAN_ORDER.includes(planParam) && planParam !== "free"
      ? planParam
      : currentId !== "free"
      ? currentId
      : "starter";
  const plan = PLANS[initialPlan];

  const methods = METHODS_BY_CURRENCY[code] || METHODS_BY_CURRENCY.BDT;
  const isManual = code === "BDT";

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    plan: initialPlan,
    payment_method: methods[0].id,
    transaction_id: "",
    sender_mobile: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setForm((p) => ({
      ...p,
      payment_method: methods.some((m) => m.id === p.payment_method) ? p.payment_method : methods[0].id,
    }));
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const copyNumber = (key, number) => {
    try { navigator.clipboard?.writeText(number); } catch {}
    setCopied(key);
    toast({ title: "Copied", description: `${key === "bank" ? "Bank details" : PAYMENT_NUMBERS[key]?.label || "Number"} copied.` });
    setTimeout(() => setCopied(""), 2000);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.plan) e.plan = "Select a plan";
    if (!form.payment_method) e.payment_method = "Select a payment method";
    if (isManual) {
      if (!form.transaction_id.trim()) e.transaction_id = "Transaction ID is required";
      else if (form.transaction_id.trim().length < 6) e.transaction_id = "Txn ID must be at least 6 characters";
      if (MOBILE_METHODS.includes(form.payment_method)) {
        if (!form.sender_mobile.trim()) e.sender_mobile = "Sender mobile is required";
        else if (!/^01[0-9]{9}$/.test(form.sender_mobile.trim())) e.sender_mobile = "Enter a valid 11-digit number (01XXXXXXXXX)";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await base44.entities.PaymentRequest.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        plan: form.plan,
        amount: Math.round(plan.price * currency.rate),
        currency: code,
        payment_method: form.payment_method,
        transaction_id: form.transaction_id.trim() || undefined,
        sender_mobile: form.sender_mobile.trim() || undefined,
        note: form.note.trim(),
        status: "pending",
      });
      setSubmitted(true);
      toast({ title: "Submitted", description: "Your payment request has been submitted." });
    } catch {
      toast({ title: "Error", description: "Could not submit payment request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h1 className="text-xl font-bold mb-2">Payment Request Submitted</h1>
          <p className="text-sm text-muted-foreground mb-1">Your payment request has been submitted successfully.</p>
          <p className="text-sm text-muted-foreground mb-6">We'll process your payment and activate your subscription shortly.</p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mb-6">
            Status: Pending Verification
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/billing"><Button className="bg-gradient-primary text-white rounded-xl">Go to Billing</Button></Link>
            <Link to="/dashboard"><Button variant="outline" className="rounded-xl">Back to Dashboard</Button></Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedMethod = methods.find((m) => m.id === form.payment_method);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Complete Payment</h1>
          <p className="text-sm text-muted-foreground">
            {isManual ? "Manual verification · bKash · Nagad · Rocket · Bank Transfer" : `Online payment · ${methods.map((m) => m.label).join(" · ")}`}
          </p>
        </div>
      </div>

      {/* Selected plan */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#7C3AED] p-6 text-white">
        <p className="text-sm text-white/70 mb-1">Selected Plan</p>
        <div className="flex items-end justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold">{plan.name} Plan</h2>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatPrice(plan.price)}</p>
            <p className="text-xs text-white/70">Subscription Duration: 1 month</p>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      {isManual ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-semibold mb-1">Payment Instructions</h3>
          <p className="text-sm text-muted-foreground mb-4">Send {formatPrice(plan.price)} to one of the numbers below, then enter your Transaction ID in the form.</p>
          <div className="space-y-3">
            {Object.entries(PAYMENT_NUMBERS).map(([key, m]) => (
              <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-accent min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{m.number}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={() => copyNumber(key, m.number)}>
                  {copied === key ? <Check className="w-3.5 h-3.5 mr-1.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  Copy Number
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-accent min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: BANK_DETAILS.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{BANK_DETAILS.label}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{BANK_DETAILS.number}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={() => copyNumber("bank", BANK_DETAILS.number)}>
                {copied === "bank" ? <Check className="w-3.5 h-3.5 mr-1.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                Copy Details
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-semibold mb-1">Online Payment</h3>
          <p className="text-sm text-muted-foreground">
            Click submit to proceed with <span className="font-medium text-foreground">{selectedMethod?.label}</span>. You'll complete your payment of <span className="font-medium text-foreground">{formatPrice(plan.price)}</span> securely.
          </p>
        </motion.div>
      )}

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="font-semibold mb-4">Payment Details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.full_name}>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" className="rounded-xl" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="rounded-xl" />
            </Field>
            <Field label="Selected Plan" error={errors.plan}>
              <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className="w-full h-10 px-3 rounded-xl bg-accent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20">
                {PLAN_ORDER.filter((id) => id !== "free").map((id) => (
                  <option key={id} value={id}>{PLANS[id].name} — {formatPrice(PLANS[id].price)}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Method" error={errors.payment_method}>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className="w-full h-10 px-3 rounded-xl bg-accent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20">
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </Field>
            {isManual && (
              <>
                <Field label="Transaction ID (Txn ID)" error={errors.transaction_id}>
                  <Input value={form.transaction_id} onChange={(e) => set("transaction_id", e.target.value)} placeholder="e.g. 9XK4B7LQ" className="rounded-xl font-mono" />
                </Field>
                {MOBILE_METHODS.includes(form.payment_method) && (
                  <Field label="Sender Mobile Number" error={errors.sender_mobile}>
                    <Input value={form.sender_mobile} onChange={(e) => set("sender_mobile", e.target.value)} placeholder="01XXXXXXXXX" className="rounded-xl" />
                  </Field>
                )}
              </>
            )}
          </div>
          <Field label="Note (optional)">
            <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} placeholder="Any additional information" className="w-full px-3 py-2 rounded-xl bg-accent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20 resize-none" />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-white rounded-xl h-11">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Payment Request"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}