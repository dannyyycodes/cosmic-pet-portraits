import { motion } from "framer-motion";
import { Play, PawPrint } from "lucide-react";

const placeholderVideos = [
  { name: "Sarah M.", pet: "Buddy the Lab", quote: "I cried reading it — it captured him perfectly." },
  { name: "James T.", pet: "Luna the Persian", quote: "Sent it to my whole family. Everyone was amazed." },
  { name: "Priya K.", pet: "Cinnamon the Rabbit", quote: "The personality section was scary accurate." },
  { name: "Mark D.", pet: "Charlie the Beagle", quote: "Best gift I've ever given my wife." },
  { name: "Emma L.", pet: "Mochi the Cat", quote: "We framed the keepsake quote page." },
  { name: "David R.", pet: "Max the Golden", quote: "I didn't expect to feel so emotional reading it." },
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
            See Why Pet Parents Can't Stop Sharing
          </h2>
          <p className="text-muted-foreground">
            Real stories from real pet parents
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {placeholderVideos.map((video, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group"
            >
              <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
                {/* Placeholder thumbnail */}
                <div className="relative aspect-[4/3] bg-secondary flex items-center justify-center">
                  <PawPrint className="w-8 h-8 text-muted-foreground/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-foreground/70 text-primary-foreground text-xs">
                    Coming soon
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{video.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">{video.pet}</p>
                  <p className="text-xs text-muted-foreground italic">"{video.quote}"</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
