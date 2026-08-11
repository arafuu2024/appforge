import React from "react";
import { motion } from "framer-motion";
import { Wifi, Battery, Signal } from "lucide-react";

export default function PhoneMockup({ url = "myapp.com", children }) {
  return (
    <motion.div
      animate={{ y: [-8, 8, -8] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute -inset-8 bg-gradient-to-r from-[#4F7CFF]/20 to-[#7C3AED]/20 rounded-[3rem] blur-2xl" />
      
      {/* Phone frame */}
      <div className="relative w-[280px] h-[560px] bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[2rem] overflow-hidden relative">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 bg-white dark:bg-gray-950">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3 text-gray-900 dark:text-white" />
              <Wifi className="w-3 h-3 text-gray-900 dark:text-white" />
              <Battery className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* App bar */}
          <div className="px-4 py-3 bg-[#4F7CFF]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-white text-sm font-semibold">{url}</span>
            </div>
          </div>

          {/* Content */}
          {children || (
            <div className="p-4 space-y-3">
              <div className="w-full h-28 rounded-xl bg-gradient-to-r from-[#4F7CFF]/10 to-[#7C3AED]/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Welcome to MyApp</p>
                  <p className="text-[10px] text-gray-500">Your premium experience</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {["Products", "Services", "About", "Contact"].map((item) => (
                  <div key={item} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="w-5 h-5 rounded-md bg-[#4F7CFF]/10 mb-1.5" />
                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4F7CFF]/20 to-[#7C3AED]/20 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="h-1.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5 px-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
            {["●", "◆", "■", "▲"].map((icon, i) => (
              <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${i === 0 ? "text-[#4F7CFF]" : "text-gray-400"}`}>
                {icon}
              </div>
            ))}
          </div>

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl" />
        </div>
      </div>
    </motion.div>
  );
}