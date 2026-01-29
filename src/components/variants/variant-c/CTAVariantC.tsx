import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Heart, Gift } from "lucide-react";

interface CTAVariantCProps {
  variant: "mid" | "final";
  trackCTAClick?: (cta: string, location: string) => void;
}

export const CTAVariantC = ({ variant, trackCTAClick }: CTAVariantCProps) => {
  return (
    <section className="relative py-16 px-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-xl mx-auto text-center"
      >
        {/* Fun Card */}
        <div className="relative p-8 rounded-3xl bg-gradient-to-b from-pink-950/30 via-card/40 to-cyan-950/30 border border-pink-400/20 backdrop-blur-sm overflow-hidden">
          {/* Floating emojis */}
          <div className="absolute top-4 left-4 text-2xl animate-bounce" style={{ animationDelay: "0s" }}>🐾</div>
          <div className="absolute top-4 right-4 text-2xl animate-bounce" style={{ animationDelay: "0.3s" }}>✨</div>
          <div className="absolute bottom-4 left-8 text-2xl animate-bounce" style={{ animationDelay: "0.6s" }}>💅</div>
          <div className="absolute bottom-4 right-8 text-2xl animate-bounce" style={{ animationDelay: "0.9s" }}>🔥</div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {variant === "mid" ? (
              <>Treat Yourself <span className="text-pink-400">&</span> Your Bestie</>
            ) : (
              <>You Know You Want To 👀</>
            )}
          </h2>

          <p className="text-muted-foreground mb-6 text-lg">
            {variant === "mid" ? (
              <>Because you both deserve to understand each other better 💕</>
            ) : (
              <>Your pet's personality is waiting to be discovered. Don't leave them on read.</>
            )}
          </p>

          {/* Fun Stats */}
          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-1.5 text-pink-300">
              <Heart className="w-4 h-4 fill-pink-400" />
              <span>50k+ happy pets</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-4 h-4" />
              <span>100% shareable</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link 
            to="/intake?mode=discover" 
            onClick={() => trackCTAClick?.('get_tea', `cta_${variant}`)}
            className="block"
          >
            <motion.button 
              className="w-full max-w-sm mx-auto text-lg font-bold px-8 py-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-[0_8px_32px_rgba(236,72,153,0.4)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.5)] transition-all duration-300"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="flex items-center justify-center gap-2">
                Get the Tea on My Pet
                <span className="text-2xl">🍵</span>
              </span>
            </motion.button>
          </Link>

          {/* Gift option */}
          <div className="mt-4">
            <Link 
              to="/gift" 
              onClick={() => trackCTAClick?.('gift', `cta_${variant}`)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-300 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Or send it to a friend who needs this in their life
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
