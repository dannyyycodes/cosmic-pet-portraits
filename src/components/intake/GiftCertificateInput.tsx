import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface GiftCertificate {
  id: string;
  code: string;
  amount_cents: number;
  gift_message: string | null;
  purchaser_email: string;
}

interface GiftCertificateInputProps {
  onApplyGift: (gift: GiftCertificate | null) => void;
  appliedGift: GiftCertificate | null;
}

export function GiftCertificateInput({ onApplyGift, appliedGift }: GiftCertificateInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateGiftCertificate = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      const { data: gift, error: fetchError } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_redeemed', false)
        .single();

      if (fetchError || !gift) {
        setError('Invalid or already redeemed gift certificate');
        return;
      }

      // Check if expired
      if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
        setError('This gift certificate has expired');
        return;
      }

      onApplyGift(gift);
      setCode('');
    } catch (err) {
      setError('Failed to validate gift certificate');
    } finally {
      setIsValidating(false);
    }
  };

  const removeGift = () => {
    onApplyGift(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {appliedGift ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-cosmic-gold/10 border border-cosmic-gold/30"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-cosmic-gold" />
              <span className="font-medium text-cosmic-gold">Gift Certificate Applied!</span>
            </div>
            <button
              onClick={removeGift}
              className="p-1 hover:bg-cosmic-gold/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-cosmic-gold" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">
            Value: <span className="text-cosmic-gold font-semibold">
              ${(appliedGift.amount_cents / 100).toFixed(2)}
            </span>
          </p>
          
          {appliedGift.gift_message && (
            <div className="mt-3 p-3 bg-card/50 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Gift message:</p>
              <p className="text-sm text-foreground italic">"{appliedGift.gift_message}"</p>
            </div>
          )}
        </motion.div>
      ) : (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Gift className="w-3.5 h-3.5" />
            {isExpanded ? 'Hide gift certificate field' : 'Redeem a gift certificate'}
          </button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-1">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GIFT-XXXX-XXXX"
                    className="h-10 text-sm uppercase bg-card/30 border-border/50"
                    onKeyDown={(e) => e.key === 'Enter' && validateGiftCertificate()}
                  />
                  <Button
                    onClick={validateGiftCertificate}
                    disabled={!code.trim() || isValidating}
                    variant="outline"
                    size="sm"
                    className="h-10 px-4"
                  >
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Redeem'
                    )}
                  </Button>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-destructive mt-1"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
