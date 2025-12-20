import { Shield, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function MoneyBackBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
        <Shield className="w-4 h-4 text-green-400" />
      </div>
      <div className="text-left">
        <div className="flex items-center gap-1.5 text-green-400 font-medium text-sm">
          <Check className="w-3.5 h-3.5" />
          100% Money-Back Guarantee
        </div>
        <p className="text-xs text-muted-foreground">
          Not satisfied? Full refund, no questions asked
        </p>
      </div>
    </motion.div>
  );
}
