import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Share2, Home, Star, Heart, Gift, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GiftInfo {
  includeGift: boolean;
  giftCode: string | null;
}

interface AllReportsCompleteProps {
  petNames: string[];
  onViewReports: () => void;
  giftInfo?: GiftInfo;
}

export function AllReportsComplete({ petNames, onViewReports, giftInfo }: AllReportsCompleteProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const petListText = petNames.length === 1 
    ? petNames[0] 
    : petNames.length === 2 
      ? `${petNames[0]} and ${petNames[1]}`
      : `${petNames.slice(0, -1).join(', ')}, and ${petNames[petNames.length - 1]}`;

  const redeemUrl = giftInfo?.giftCode 
    ? `${window.location.origin}/redeem-gift?code=${giftInfo.giftCode}`
    : '';

  const copyGiftLink = () => {
    if (redeemUrl) {
      navigator.clipboard.writeText(redeemUrl);
      setCopied(true);
      toast.success('Gift link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 30%, hsl(var(--primary) / 0.3), transparent 60%)',
          }}
        />
        {/* Celebratory particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['hsl(var(--primary))', 'hsl(var(--cosmic-gold))', 'hsl(var(--nebula-pink))'][i % 3],
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -100],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg text-center"
        >
          {/* Celebration icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            className="relative w-32 h-32 mx-auto mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cosmic-gold via-primary to-nebula-pink opacity-30 blur-xl"
            />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center">
              <Star className="w-16 h-16 text-white fill-white" />
            </div>
            
            {/* Orbiting hearts */}
            {petNames.map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * (8 / petNames.length),
                }}
              >
                <motion.div
                  style={{
                    x: 60,
                    y: -8,
                  }}
                >
                  <Heart className="w-4 h-4 text-nebula-pink fill-nebula-pink" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4"
          >
            Cosmic Journey Complete! ✨
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground mb-8"
          >
            You've discovered the celestial secrets of {petListText}
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mb-10"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{petNames.length}</div>
              <div className="text-sm text-muted-foreground">
                {petNames.length === 1 ? 'Report' : 'Reports'}
              </div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-cosmic-gold">17</div>
              <div className="text-sm text-muted-foreground">Cosmic Insights</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-nebula-pink">∞</div>
              <div className="text-sm text-muted-foreground">Love</div>
            </div>
          </motion.div>

          {/* Gift Certificate Section - Show if gift was included */}
          {giftInfo?.includeGift && giftInfo?.giftCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-cosmic-gold/20 to-nebula-pink/20 border border-cosmic-gold/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-semibold text-foreground">Your Gift Reading is Ready!</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                You added a gift reading for a friend. Share the link below with them so they can get their own cosmic pet reading!
              </p>
              
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-background/50 rounded-lg border border-border/50 font-mono text-sm truncate">
                  {redeemUrl}
                </div>
                <Button
                  onClick={copyGiftLink}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                This gift code is worth $35 and never expires. They can use it for any pet!
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Button
              onClick={onViewReports}
              variant="cosmic"
              size="xl"
              className="w-full"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View All Reports
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'AstroPets - Cosmic Pet Reports',
                      text: `I just discovered the cosmic secrets of ${petListText}! 🌟`,
                      url: window.location.origin,
                    });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>

          {/* Footer message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-muted-foreground/60 mt-10"
          >
            Your reports have been emailed to you for safekeeping 💫
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
