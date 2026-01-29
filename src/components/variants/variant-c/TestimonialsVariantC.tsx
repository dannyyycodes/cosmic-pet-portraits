import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const memeTestimonials = [
  {
    name: "jess_and_milo",
    handle: "@jess_and_milo",
    avatar: "🐕",
    content: "just got my dog's cosmic reading and i'm SCREAMING 😭 it said he has 'boundary issues' and 'loves too hard' which is literally just him trying to sit on everyone's lap at once",
    likes: "2.4k",
    comments: "89",
    shares: "156",
  },
  {
    name: "catlady_chronicles",
    handle: "@catlady_chronicles",
    avatar: "🐈",
    content: "the accuracy is scary?? it described my cat as 'emotionally unavailable but deeply loyal' and I—\nthat's literally her just staring at me from across the room for 6 hours straight 💀",
    likes: "5.1k",
    comments: "234",
    shares: "412",
  },
  {
    name: "bunny_momma",
    handle: "@bunny_momma",
    avatar: "🐰",
    content: "okay but why did this personality report just call out my rabbit for being 'dramatic and attention-seeking' 💀\n\nma'am that's MY son you're talking about and you're absolutely right",
    likes: "3.8k",
    comments: "167",
    shares: "289",
  },
];

export const TestimonialsVariantC = () => {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            The Girlies Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Obsessed</span> 💅
          </h2>
          <p className="text-muted-foreground">
            This will break your group chat
          </p>
        </motion.div>

        <div className="space-y-4">
          {memeTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center text-xl">
                  {testimonial.avatar}
                </span>
                <div>
                  <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                </div>
              </div>

              {/* Content */}
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line mb-4">
                {testimonial.content}
              </p>

              {/* Engagement */}
              <div className="flex items-center gap-6 text-muted-foreground text-xs">
                <span className="flex items-center gap-1.5 hover:text-pink-400 transition-colors cursor-pointer">
                  <Heart className="w-4 h-4" />
                  {testimonial.likes}
                </span>
                <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                  {testimonial.comments}
                </span>
                <span className="flex items-center gap-1.5 hover:text-purple-400 transition-colors cursor-pointer">
                  <Share2 className="w-4 h-4" />
                  {testimonial.shares}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
