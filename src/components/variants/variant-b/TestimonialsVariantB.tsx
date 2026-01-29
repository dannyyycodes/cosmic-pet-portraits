import { motion } from "framer-motion";
import { Star, Quote, ArrowRight } from "lucide-react";

const beforeAfterTestimonials = [
  {
    name: "Sarah M.",
    pet: "Max",
    species: "Golden Retriever",
    before: "Max was constantly barking at nothing, destroying furniture, and wouldn't listen to commands. I thought he hated me.",
    after: "Now I understand his anxiety triggers! He needed more mental stimulation. We've completely transformed our bond.",
    result: "Behavior improved 80%",
  },
  {
    name: "Jennifer K.",
    pet: "Luna",
    species: "Persian Cat",
    before: "Luna was hiding all day, wouldn't eat properly, and seemed depressed. Multiple vet visits found nothing wrong.",
    after: "Her cosmic profile revealed she's an 'Old Soul' who needs quiet bonding time. She's now thriving!",
    result: "No more hiding",
  },
  {
    name: "David R.",
    pet: "Cooper",
    species: "Beagle",
    before: "Cooper would escape the yard constantly and refuse recall. Training wasn't working at all.",
    after: "His adventurer archetype explained everything. Scent games and exploration walks fixed it completely.",
    result: "Zero escapes in 3 months",
  },
];

export const TestimonialsVariantB = () => {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
            Real <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Transformations</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            See how understanding their pet's true nature changed everything
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {beforeAfterTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-gradient-to-b from-card/80 to-card/40 rounded-2xl border border-border/50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/30 bg-gradient-to-r from-red-900/20 to-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.pet} • {testimonial.species}</p>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Before/After */}
              <div className="p-4 space-y-4">
                {/* Before */}
                <div className="relative pl-4 border-l-2 border-red-500/50">
                  <span className="absolute -left-3 top-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">✗</span>
                  <p className="text-xs uppercase tracking-wide text-red-400 font-semibold mb-1">Before</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.before}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-emerald-400 rotate-90" />
                </div>

                {/* After */}
                <div className="relative pl-4 border-l-2 border-emerald-500/50">
                  <span className="absolute -left-3 top-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">✓</span>
                  <p className="text-xs uppercase tracking-wide text-emerald-400 font-semibold mb-1">After</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.after}</p>
                </div>

                {/* Result badge */}
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                    ✨ {testimonial.result}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
