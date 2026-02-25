import { motion } from "framer-motion";
import { Play } from "lucide-react";
import sarahImg from "@/assets/testimonials/sarah.jpg";
import jamesImg from "@/assets/testimonials/james.jpg";
import priyaImg from "@/assets/testimonials/priya.jpg";
import markImg from "@/assets/testimonials/mark.jpg";
import emmaImg from "@/assets/testimonials/emma.jpg";
import davidImg from "@/assets/testimonials/david.jpg";

const ugcSlots = [
  { name: "Sarah M.", pet: "Buddy the Lab", quote: "I cried reading it — it captured him perfectly.", photo: sarahImg },
  { name: "James T.", pet: "Luna the Persian", quote: "Sent it to my whole family. Everyone was amazed.", photo: jamesImg },
  { name: "Priya K.", pet: "Cinnamon the Rabbit", quote: "The personality section was scary accurate.", photo: priyaImg },
  { name: "Mark D.", pet: "Charlie the Beagle", quote: "Best gift I've ever given my wife.", photo: markImg },
  { name: "Emma L.", pet: "Mochi the Cat", quote: "We framed the keepsake quote page.", photo: emmaImg },
  { name: "David R.", pet: "Max the Golden", quote: "I didn't expect to feel so emotional reading it.", photo: davidImg },
];

export const VideoTestimonials = () => {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            These Moments Made Pet Parents Cry
          </h2>
          <p className="text-muted-foreground">
            The moment you realize how deeply they've touched your life
          </p>
        </motion.div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {ugcSlots.map((slot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="snap-center shrink-0 w-[180px] md:w-auto group"
            >
              <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
                {/* 9:16 vertical iPhone-style placeholder */}
                <div className="relative aspect-[9/16] overflow-hidden">
                  <img 
                    src={slot.photo} 
                    alt={slot.name}
                    className="absolute inset-0 w-full h-full object-cover filter blur-[2px] scale-110"
                  />
                  <div className="absolute inset-0 bg-foreground/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  {/* Bottom gradient with info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="text-white text-sm font-semibold">{slot.name}</p>
                    <p className="text-white/80 text-xs">{slot.pet}</p>
                    <p className="text-white/90 text-xs italic mt-1">"{slot.quote}"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
