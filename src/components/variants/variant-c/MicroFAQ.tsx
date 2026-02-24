import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export const MicroFAQ = () => {
  return (
    <section className="relative py-6 px-4 z-10">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto"
      >
        <div className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border shadow-[var(--shadow-card)]">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">"Do I need my pet's birth time?"</p>
            <p className="text-sm text-muted-foreground mt-1">No — we only need their birthday. If you don't know it, an approximate date works great too.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
