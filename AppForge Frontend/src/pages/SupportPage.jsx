import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Book, Mail } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Support</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Book, title: "Documentation", desc: "Browse guides and tutorials", color: "#4F7CFF" },
          { icon: MessageCircle, title: "Live Chat", desc: "Chat with our support team", color: "#22C55E" },
          { icon: Mail, title: "Email", desc: "Send us a detailed message", color: "#7C3AED" },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-center card-hover cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6"
      >
        <h3 className="font-semibold mb-4">Submit a Ticket</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full h-11 px-4 rounded-xl bg-accent text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
          />
          <textarea
            placeholder="Describe your issue..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-accent text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20 resize-none"
          />
          <Button className="bg-gradient-primary text-white hover:opacity-90 rounded-xl">
            Submit Ticket
          </Button>
        </div>
      </motion.div>
    </div>
  );
}