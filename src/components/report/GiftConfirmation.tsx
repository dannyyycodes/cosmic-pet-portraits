import { motion } from 'framer-motion';
import { Gift, Mail, Heart, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GiftConfirmationProps {
  petName: string;
  recipientName: string;
  recipientEmail: string;
  sunSign: string;
}

export function GiftConfirmation({ petName, recipientName, recipientEmail, sunSign }: GiftConfirmationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-6">
      {/* Background celebration particles */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -50],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            {i % 3 === 0 && <Sparkles className="w-4 h-4 text-cosmic-gold/40" />}
            {i % 3 === 1 && <Heart className="w-3 h-3 text-nebula-pink/40" />}
            {i % 3 === 2 && <div className="w-2 h-2 bg-primary/30 rounded-full" />}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center shadow-2xl shadow-cosmic-gold/30"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Gift className="w-12 h-12 text-background" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4"
        >
          Your Gift is on its Way! 🎁
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-lg mb-8"
        >
          {petName}'s cosmic portrait has been sent to {recipientName}
        </motion.p>

        {/* Email confirmation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-card/40 border border-border/50 mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Sent to</p>
              <p className="font-medium text-foreground">{recipientEmail}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-green-500">
            <Check className="w-4 h-4" />
            <span>Email sent successfully</span>
          </div>
        </motion.div>

        {/* What they'll receive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-left p-6 rounded-2xl bg-muted/20 border border-border/30"
        >
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cosmic-gold" />
            What {recipientName} will receive:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✦</span>
              <span>A beautifully crafted email with your gift message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✦</span>
              <span>{petName}'s full cosmic portrait as a {sunSign}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✦</span>
              <span>A magical link to view their personalized reading</span>
            </li>
          </ul>
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="gap-2"
          >
            Get a reading for your pet too
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
