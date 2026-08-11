import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PaymentPending() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h1 className="text-xl font-bold mb-2">Payment Pending</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment is being verified. This usually takes a few moments. We'll notify you once it's confirmed.
        </p>
        <Button onClick={() => navigate("/billing")} variant="outline" className="rounded-xl">
          Back to Billing
        </Button>
      </motion.div>
    </div>
  );
}