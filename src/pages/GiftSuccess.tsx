import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, CheckCircle, Mail, Copy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { toast } from 'sonner';

export default function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const giftCode = searchParams.get('code') || '';

  const copyCode = () => {
    navigator.clipboard.writeText(giftCode);
    toast.success('Gift code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Gift Purchased Successfully!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your cosmic gift is on its way ✨
            </p>
          </div>

          {/* Gift code display */}
          {giftCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-nebula-purple/20 border border-primary/30"
            >
              <p className="text-sm text-muted-foreground mb-2">Gift Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-mono font-bold text-foreground tracking-widest">
                  {giftCode}
                </p>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-lg hover:bg-card/50 transition-colors"
                >
                  <Copy className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </motion.div>
          )}

          {/* What happens next */}
          <div className="p-4 rounded-xl bg-card/30 border border-border/30 space-y-3 text-left">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              What happens next?
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• You'll receive a confirmation email</li>
              <li>• Your recipient will get their gift code by email</li>
              <li>• They can redeem it anytime within 1 year</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link to="/gift" className="block">
              <Button variant="cosmic" size="lg" className="w-full">
                <Gift className="w-5 h-5 mr-2" />
                Purchase Another Gift
              </Button>
            </Link>
            
            <Link to="/" className="block">
              <Button variant="ghost" className="w-full">
                Back to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Questions? Contact us at support@petastrology.com
          </p>
        </motion.div>
      </div>
    </div>
  );
}
