import React from "react";
import { motion } from "framer-motion";
import { Link2, Settings2, Eye, Download } from "lucide-react";

const steps = [
  { icon: Link2, title: "Paste Your URL", description: "Enter your website URL or upload your HTML files. We support any responsive website.", num: "01" },
  { icon: Settings2, title: "Customize", description: "Choose your branding, colors, permissions, and features through our intuitive wizard.", num: "02" },
  { icon: Eye, title: "Preview", description: "See a live preview of your app on a virtual Android device before generating.", num: "03" },
  { icon: Download, title: "Download", description: "Get your signed APK and AAB files ready for distribution on Google Play Store.", num: "04" },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent via-[#4F7CFF]/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold mb-4">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Four simple steps to your{" "}
            <span className="text-gradient">Android app</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From website to app store in minutes, not months.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              {index < 3 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-[#4F7CFF]/30 to-transparent" />
              )}
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gray-100/50 dark:shadow-none">
                <step.icon className="w-8 h-8 text-[#4F7CFF]" />
              </div>
              <span className="text-xs font-bold text-[#4F7CFF]/50 mb-2 block">{step.num}</span>
              <h3 className="font-bold text-base mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}