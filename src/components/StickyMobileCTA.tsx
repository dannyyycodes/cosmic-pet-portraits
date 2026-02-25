import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useABTest } from "@/hooks/useABTest";

export const StickyMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isVariantC } = useABTest();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden ${
            isVariantC 
              ? "bg-gradient-to-t from-[#FFF4D2] via-[#FFF4D2] to-transparent"
              : "bg-gradient-to-t from-background via-background to-transparent"
          }`}
        >
          <Link to={isVariantC ? "/checkout?tier=premium" : "/intake"} className="block">
            <button className={`w-full py-4 px-6 text-white font-bold text-lg rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${
              isVariantC 
                ? "bg-primary hover:bg-primary/90 shadow-primary/30"
                : "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-purple-500/30"
            }`}>
              <Sparkles className="w-5 h-5" />
              {isVariantC ? "Discover Their Soul" : "Get My Pet's Cosmic Report"}
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
