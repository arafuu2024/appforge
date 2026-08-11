import React from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, Palette, Shield, Zap, 
  Cloud, Bell, Download, Globe
} from "lucide-react";

const features = [
  { icon: Smartphone, title: "Material 3 Design", description: "Your app automatically adopts modern Material You design language for a native feel.", color: "#4F7CFF" },
  { icon: Zap, title: "Instant Conversion", description: "Convert any responsive website to a polished Android app in under 5 minutes.", color: "#F59E0B" },
  { icon: Palette, title: "Full Customization", description: "Customize every aspect — colors, icons, splash screens, themes, and branding.", color: "#7C3AED" },
  { icon: Shield, title: "Secure & Signed", description: "APKs are automatically signed and ready for Google Play Store submission.", color: "#22C55E" },
  { icon: Cloud, title: "Firebase Integration", description: "One-click Firebase setup for analytics, crash reporting, and push notifications.", color: "#EF4444" },
  { icon: Bell, title: "Push Notifications", description: "Engage users with targeted push notifications powered by Firebase Cloud Messaging.", color: "#4F7CFF" },
  { icon: Download, title: "APK & AAB Export", description: "Download both APK for direct install and AAB for Play Store distribution.", color: "#7C3AED" },
  { icon: Globe, title: "Offline Support", description: "Built-in service worker caching so your app works even without internet.", color: "#22C55E" },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-semibold mb-4">
            FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to build{" "}
            <span className="text-gradient">amazing apps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit that transforms your web presence into a professional mobile experience.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 card-hover cursor-default"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}