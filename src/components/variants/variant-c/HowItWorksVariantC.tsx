import { motion } from "framer-motion";
import { PenLine, Sparkles, Heart } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Tell us about your pet",
    description: "Answer a few fun questions — takes less than 2 minutes.",
    icon: PenLine,
  },
  {
    number: "2",
    title: "We create something beautiful",
    description: "Our system generates a deeply personal, beautifully designed report — instantly.",
    icon: Sparkles,
  },
  {
    number: "3",
    title: "Read, share, and treasure",
    description: "Download your keepsake PDF, share with family, or frame your favorite page.",
    icon: Heart,
  },
];

export const HowItWorksVariantC = () => {
  return (
    <section id="how-it-works" className="relative py-16 px-4 z-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Three simple steps to something you'll treasure forever
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] text-center h-full">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--warm-sage)/0.12)] flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-[hsl(var(--warm-sage))]" />
                </div>
                <div className="text-xs font-bold text-primary mb-2">Step {step.number}</div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
