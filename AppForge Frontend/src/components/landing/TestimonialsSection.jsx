import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Sarah Chen", role: "Founder, StyleBoutique", quote: "AppForge turned our e-commerce site into a beautiful Android app overnight. Our mobile sales increased 3x.", avatar: "S" },
  { name: "Marcus Johnson", role: "CTO, TechFlow", quote: "The Material 3 integration is incredible. Our app looks and feels completely native. Couldn't be happier.", avatar: "M" },
  { name: "Emma Rodriguez", role: "Product Manager, EduLearn", quote: "We went from zero mobile presence to a 4.8-star app on Play Store. The whole process took 20 minutes.", avatar: "E" },
  { name: "David Kim", role: "CEO, LocalBites", quote: "Push notifications alone doubled our daily engagement. AppForge made it effortless to set up.", avatar: "D" },
  { name: "Lisa Wang", role: "Designer, Artisan Co", quote: "As a designer, I'm impressed by the attention to detail. The generated apps actually look premium.", avatar: "L" },
  { name: "James Park", role: "Developer, NexGen", quote: "Saved us months of native development. The Firebase integration works perfectly out of the box.", avatar: "J" },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs font-semibold mb-4">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Loved by <span className="text-gradient">thousands</span> of creators
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 card-hover"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}