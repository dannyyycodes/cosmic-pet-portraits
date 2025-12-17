import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
}

interface CouponInputProps {
  onApplyCoupon: (coupon: Coupon | null) => void;
  appliedCoupon: Coupon | null;
  subtotal: number;
}

export function CouponInput({ onApplyCoupon, appliedCoupon, subtotal }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateCoupon = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      const { data: coupon, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !coupon) {
        setError('Invalid coupon code');
        return;
      }

      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setError('This coupon has expired');
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        setError('This coupon is no longer available');
        return;
      }

      // Check minimum purchase
      if (coupon.min_purchase_cents && subtotal < coupon.min_purchase_cents) {
        setError(`Minimum purchase of $${(coupon.min_purchase_cents / 100).toFixed(2)} required`);
        return;
      }

      onApplyCoupon(coupon);
      setCode('');
    } catch (err) {
      setError('Failed to validate coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    onApplyCoupon(null);
    setError(null);
  };

  const getDiscountAmount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return (subtotal * coupon.discount_value / 100);
    }
    return coupon.discount_value;
  };

  return (
    <div className="space-y-2">
      {appliedCoupon ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              {appliedCoupon.code}
            </span>
            <span className="text-sm text-green-500/80">
              (-${(getDiscountAmount(appliedCoupon) / 100).toFixed(2)})
            </span>
          </div>
          <button
            onClick={removeCoupon}
            className="p-1 hover:bg-green-500/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-green-500" />
          </button>
        </motion.div>
      ) : (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Tag className="w-3.5 h-3.5" />
            {isExpanded ? 'Hide coupon field' : 'Have a coupon code?'}
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
                    placeholder="COUPON CODE"
                    className="h-10 text-sm uppercase bg-card/30 border-border/50"
                    onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                  />
                  <Button
                    onClick={validateCoupon}
                    disabled={!code.trim() || isValidating}
                    variant="outline"
                    size="sm"
                    className="h-10 px-4"
                  >
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Apply'
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
