import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

export default function PaymentSuccess({ amount = "৳0", method = "bKash" }) {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan");

  // Refresh the global user so the new subscription is reflected everywhere.
  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
        </div>
        <h1 className="text-xl font-bold mb-2">Payment Successful</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Your payment of <span className="font-semibold text-foreground">{params.get("amount") || amount}</span> via {params.get("method") || method} has been received.
        </p>
        {plan && (
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] mb-6">
            <CheckCircle2 className="w-4 h-4" /> Now on the {plan} plan
          </div>
        )}
        {!plan && <div className="mb-6" />}
        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard")} className="flex-1 bg-gradient-primary text-white rounded-xl">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Invoice
          </Button>
        </div>
      </motion.div>
    </div>
  );
}