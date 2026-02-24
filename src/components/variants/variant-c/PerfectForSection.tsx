import { motion } from "framer-motion";
import { Cake, Heart, Star, Gift } from "lucide-react";

const occasions = [
  { label: "Pet birthdays", icon: Cake },
  { label: "Gotcha days", icon: Heart },
  { label: "Memorial keepsakes", icon: Star },
  { label: "Surprise gifts", icon: Gift },
];

export const PerfectForSection = () => {
  return (
    <section className="relative py-10 px-4 z-10">
      <div className="max-w-3xl mx-auto text-center">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground font-medium shadow-[var(--shadow-card)]"
            >
              <o.icon className="w-4 h-4 text-primary" />
              {o.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
