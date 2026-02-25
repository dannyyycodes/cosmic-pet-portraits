import { motion } from "framer-motion";
import { Cake, Heart, Star, Gift } from "lucide-react";

const occasions = [
  { label: "Celebrating their special day", icon: Cake, borderColor: "hsl(350 60% 55%)" },
  { label: "Honoring the day you found each other", icon: Heart, borderColor: "hsl(145 47% 33%)" },
  { label: "Keeping their memory alive", icon: Star, borderColor: "hsl(43 80% 50%)" },
  { label: "A gift that says 'I see you'", icon: Gift, borderColor: "hsl(16 78% 55%)" },
];

export const PerfectForSection = () => {
  return (
    <section className="relative py-12 px-4 z-10">
      <div className="absolute inset-0 bg-[hsl(40_60%_87%/0.3)]" />
      <div className="max-w-3xl mx-auto text-center relative">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4"
        >
          Perfect for
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {occasions.map((o, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-card border border-border text-sm text-foreground font-medium shadow-[var(--shadow-card)]"
              style={{ borderLeftWidth: '3px', borderLeftColor: o.borderColor }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${o.borderColor}15` }}>
                <o.icon className="w-4 h-4" style={{ color: o.borderColor }} />
              </div>
              {o.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};