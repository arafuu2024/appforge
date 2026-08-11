import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useCurrency } from "@/lib/currency";
import CurrencySelector from "@/components/currency/CurrencySelector";

const plans = [
  {
    name: "Free",
    priceBDT: 0,
    period: "forever",
    description: "Perfect for trying out AppForge",
    features: ["1 app", "Basic customization", "APK download", "AppForge branding", "Community support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    priceBDT: 499,
    period: "/month",
    description: "For your first production app",
    features: ["3 apps", "Full customization", "APK download", "Remove branding", "Email support"],
    cta: "Start Starter",
    popular: false,
  },
  {
    name: "Professional",
    priceBDT: 1499,
    period: "/month",
    description: "For individuals and small teams",
    features: ["15 apps", "APK + AAB download", "Firebase integration", "Push notifications", "Analytics", "Priority support"],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Business",
    priceBDT: 3499,
    period: "/month",
    description: "For agencies and businesses",
    features: ["Unlimited apps", "Custom templates", "API access", "White-label", "Dedicated support", "SLA guarantee"],
    cta: "Contact Sales",
    popular: false,
  },
  {
    name: "Enterprise",
    priceBDT: 9999,
    period: "/month",
    description: "For large-scale deployments",
    features: ["Everything in Business", "On-premise option", "Custom SLA", "Account manager", "Training sessions"],
    cta: "Talk to Us",
    popular: false,
  },
];

const METHODS_BY_CURRENCY = {
  BDT: ["bKash", "Nagad", "Rocket", "Bank Transfer"],
  USD: ["Stripe", "PayPal", "Visa", "Mastercard", "Google Pay", "Apple Pay"],
  EUR: ["Stripe", "PayPal", "SEPA"],
  INR: ["UPI", "Razorpay", "Cards"],
  GBP: ["Stripe", "PayPal", "Visa", "Mastercard"],
};

export default function PricingSection() {
  const { code, formatPrice } = useCurrency();
  const paymentMethods = METHODS_BY_CURRENCY[code] || METHODS_BY_CURRENCY.BDT;

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-transparent via-[#7C3AED]/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-semibold mb-4">
            PRICING
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simple, transparent{" "}
            <span className="text-gradient">pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <CurrencySelector className="justify-center mb-8" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-7 rounded-2xl border ${
                plan.popular
                  ? "bg-gradient-to-b from-[#4F7CFF]/5 to-[#7C3AED]/5 border-[#4F7CFF]/30 shadow-xl shadow-[#4F7CFF]/10"
                  : "bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-white text-xs font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{formatPrice(plan.priceBDT)}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <Link to="/register">
                <Button
                  className={`w-full mt-6 h-11 rounded-xl text-sm font-medium ${
                    plan.popular
                      ? "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-[#4F7CFF]/20"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground">We accept</span>
          {paymentMethods.map((m) => (
            <span key={m} className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs font-semibold text-muted-foreground">
              {m}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}