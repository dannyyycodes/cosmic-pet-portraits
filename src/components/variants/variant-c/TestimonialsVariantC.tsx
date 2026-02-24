import { motion } from "framer-motion";
import { Star, BadgeCheck } from "lucide-react";
import sarahImg from "@/assets/testimonials/sarah.jpg";
import jamesImg from "@/assets/testimonials/james.jpg";
import priyaImg from "@/assets/testimonials/priya.jpg";
import emmaImg from "@/assets/testimonials/emma.jpg";
import davidImg from "@/assets/testimonials/david.jpg";
import markImg from "@/assets/testimonials/mark.jpg";

const testimonials = [
  {
    name: "Sarah M.",
    pet: "Buddy — Labrador, Age 6",
    photo: sarahImg,
    highlight: "It described things about Buddy that I've never been able to put into words.",
    review: "The personality breakdown was so detailed and personal. I shared it with my partner and we both teared up. This isn't just a novelty — it's a genuine keepsake we'll treasure.",
    rating: 5,
  },
  {
    name: "James T.",
    pet: "Luna — Persian Cat, Age 3",
    photo: jamesImg,
    highlight: "I bought it as a joke. Then I read it and got emotional.",
    review: "Luna's report captured her perfectly — the section about her being 'selectively affectionate' had me laughing and crying at the same time. Sent it to my whole family.",
    rating: 5,
  },
  {
    name: "Priya K.",
    pet: "Cinnamon — Holland Lop, Age 2",
    photo: priyaImg,
    highlight: "Scary accurate. How did it know she thumps when she's jealous?",
    review: "I didn't expect this level of depth for a rabbit. The emotional blueprint section was incredibly detailed and actually helped me understand her behaviour better.",
    rating: 5,
  },
  {
    name: "Emma L.",
    pet: "Mochi — Siamese Cat, Age 5",
    photo: emmaImg,
    highlight: "We framed the keepsake quote page. It's hanging in our living room.",
    review: "The report was beautifully designed and the writing was so warm and personal. It felt like someone who truly understood cats wrote it just for Mochi.",
    rating: 5,
  },
  {
    name: "David R.",
    pet: "Max — Golden Retriever, Age 8",
    photo: davidImg,
    highlight: "Max is getting older. This report is something I'll keep forever.",
    review: "I wanted something to remember him by that goes deeper than photos. This report captures his spirit, his quirks, everything that makes Max who he is. Worth every penny.",
    rating: 5,
  },
  {
    name: "Mark D.",
    pet: "Charlie — Beagle, Age 4",
    photo: markImg,
    highlight: "Best gift I've ever given my wife. She absolutely loved it.",
    review: "Bought it for my wife's birthday — she's obsessed with our Beagle. She read it three times and kept reading quotes out loud. The portrait was the cherry on top.",
    rating: 5,
  },
];

export const TestimonialsVariantC = () => {
  return (
    <section id="testimonials" className="relative py-16 px-4 z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Real Stories from Real Pet Parents
          </h2>
          <p className="text-muted-foreground">
            Join thousands of pet parents who've discovered something special
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] h-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={t.photo} 
                    alt={t.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <BadgeCheck className="w-4 h-4 text-[hsl(var(--warm-sage))]" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t.pet}</p>
                  </div>
                  <div className="flex">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[hsl(var(--warm-gold))] text-[hsl(var(--warm-gold))]" />
                    ))}
                  </div>
                </div>

                {/* Highlight */}
                <p className="font-semibold text-foreground text-sm mb-2">
                  "{t.highlight}"
                </p>

                {/* Review */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.review}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
