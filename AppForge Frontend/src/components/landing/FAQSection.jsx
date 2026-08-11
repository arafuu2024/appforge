import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What types of websites can I convert?", a: "AppForge works with any responsive website — WordPress, Shopify, React, static HTML, and more. As long as your site works well on mobile browsers, it will work great as an app." },
  { q: "Do I need coding experience?", a: "Not at all. Our wizard guides you through every step. Just paste your URL, customize your branding, and download your app. The entire process takes about 5 minutes." },
  { q: "Can I publish to Google Play Store?", a: "Yes! We generate both APK and AAB (Android App Bundle) files. The AAB format is the required format for Google Play Store submissions." },
  { q: "Is the app a simple WebView wrapper?", a: "It goes far beyond that. We add Material 3 design, native navigation, push notifications, offline support, file handling, deep linking, and much more to create a truly native experience." },
  { q: "Can I update my app later?", a: "Absolutely. You can rebuild your app anytime with updated content or new settings. Your app will automatically reflect changes to your website." },
  { q: "Do you offer white-label solutions?", a: "Yes, our Business plan includes white-label capability. Remove all AppForge branding and make the app entirely yours." },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently asked{" "}
            <span className="text-gradient">questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-gray-100 dark:border-gray-800 rounded-xl px-5 data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900/50 data-[state=open]:shadow-sm transition-all"
              >
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}