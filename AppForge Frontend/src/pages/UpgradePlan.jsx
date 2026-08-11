import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PLANS, PLAN_ORDER, getCurrentPlanId } from "@/lib/plans";
import { useCurrency } from "@/lib/currency";
import CurrencySelector from "@/components/currency/CurrencySelector";

export default function UpgradePlan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const currentId = getCurrentPlanId(user);
  const currentIndex = PLAN_ORDER.indexOf(currentId);
  const { formatPrice } = useCurrency();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
          Choose the plan that fits your builds. Cancel anytime.
        </p>
      </div>

      <CurrencySelector className="justify-center" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {PLAN_ORDER.map((id, i) => {
          const plan = PLANS[id];
          const isCurrent = id === currentId;
          const isLower = i < currentIndex;
          const highlight = id === "professional";
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl p-5 flex flex-col border-2 ${highlight ? "border-[#4F7CFF] bg-white dark:bg-gray-900/50" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50"}`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-primary text-white">POPULAR</span>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{plan.name}</p>
                {isCurrent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">CURRENT</span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>

              <ul className="mt-4 space-y-2 flex-1">
                {plan.featureList.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Projects</span><span className="font-medium text-foreground">{plan.projects === Infinity ? "Unlimited" : plan.projects}</span></div>
                <div className="flex justify-between"><span>Builds/mo</span><span className="font-medium text-foreground">{plan.buildsPerMonth === Infinity ? "Unlimited" : plan.buildsPerMonth}</span></div>
                <div className="flex justify-between"><span>Storage</span><span className="font-medium text-foreground">{plan.storage}</span></div>
                <div className="flex justify-between"><span>Support</span><span className="font-medium text-foreground">{plan.support}</span></div>
              </div>

              <Button
                className={`mt-5 w-full rounded-xl h-10 ${isCurrent ? "" : "bg-gradient-primary text-white"}`}
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || isLower}
                onClick={() => navigate(`/payment?plan=${id}`)}
              >
                {isCurrent ? "Current Plan" : isLower ? "Included" : (<><Crown className="w-4 h-4 mr-2" />Upgrade Now</>)}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}