import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PaymentFailed() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-[#EF4444]" />
        </div>
        <h1 className="text-xl font-bold mb-2">Payment Failed</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment could not be processed. No charges were made. Please try again or use a different payment method.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/billing")} className="flex-1 bg-gradient-primary text-white rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
            Later
          </Button>
        </div>
      </motion.div>
    </div>
  );
}