import { motion } from "framer-motion";
import { Zap, Download, Printer, Star, Heart, Sparkles } from "lucide-react";

const previewPages = [
  {
    title: "Personality Overview",
    icon: Star,
    content: "Luna is a deeply intuitive soul with an extraordinary ability to sense the emotions of those around her.",
    borderColor: "hsl(145 47% 33%)",
  },
  {
    title: "Emotional Blueprint",
    icon: Heart,
    content: "Attachment Style: Secure & Devoted. Luna bonds deeply and expresses love through physical closeness and gentle gazes.",
    borderColor: "hsl(43 80% 50%)",
  },
  {
    title: "Cosmic Profile",
    icon: Sparkles,
    content: "As a Pisces pet, Luna carries a dreamy, compassionate energy that makes her especially attuned to the moods of her household.",
    borderColor: "hsl(25 30% 45%)",
  },
  {
    title: "Keepsake Quote",
    icon: Star,
    content: '"In a world of ordinary pets, Luna is a gentle reminder that love doesn\'t need words to be understood."',
    borderColor: "hsl(145 47% 33%)",
  },
];

export const ReportPreviewSection = () => {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="absolute inset-0 bg-[hsl(40_60%_87%/0.4)]" />
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            A Glimpse Inside
          </h2>
          <p className="text-muted-foreground">
            Every report is a beautifully crafted keepsake
          </p>
        </motion.div>

        {/* Scrollable Preview Cards */}
        <div className="relative">
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-4 -mx-4">
            {previewPages.map((page, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="snap-center shrink-0 w-[300px] sm:w-[320px]"
              >
                <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] h-full overflow-hidden relative">
                  {/* Colored top border */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: page.borderColor }} />
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${page.borderColor}20` }}
                  >
                    <page.icon className="w-5 h-5" style={{ color: page.borderColor }} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{page.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {page.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delivery Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Delivered instantly
          </span>
          <span className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Downloadable PDF
          </span>
          <span className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            Printable keepsake
          </span>
        </motion.div>
      </div>
    </section>
  );
};
