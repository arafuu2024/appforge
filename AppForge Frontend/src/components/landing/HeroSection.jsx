import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import PhoneMockup from "@/components/landing/PhoneMockup";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4F7CFF]/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#22C55E]/8 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        
        {/* Floating shapes */}
        <motion.div
          animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-1/4 w-4 h-4 rounded-full bg-[#4F7CFF]/30"
        />
        <motion.div
          animate={{ y: [20, -20, 20], rotate: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-16 w-6 h-6 rounded-lg bg-[#7C3AED]/20 rotate-45"
        />
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-16 w-3 h-3 rounded-full bg-[#22C55E]/30"
        />
        <motion.div
          animate={{ y: [10, -20, 10], x: [-5, 5, -5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-60 left-1/3 w-5 h-5 rounded-md bg-[#F59E0B]/20 rotate-12"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] text-sm font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Now with Material 3 Support
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Turn any website into a{" "}
              <span className="text-gradient">premium Android app</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Convert your responsive website into a professional, native-feeling Android application in minutes. No coding required.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-gradient-primary text-white hover:opacity-90 text-base px-8 h-12 rounded-xl shadow-lg shadow-[#4F7CFF]/25 w-full sm:w-auto"
                >
                  Start Building Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5 justify-center lg:justify-start">
              {[
                { icon: Zap, label: "5-minute build" },
                { icon: Shield, label: "Signed & secure" },
                { icon: Smartphone, label: "Material 3 ready" },
              ].map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-gray-800 text-xs font-medium text-muted-foreground">
                  <f.icon className="w-3.5 h-3.5 text-[#4F7CFF]" />
                  {f.label}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#7C3AED] border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">12,000+</span> apps created
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}