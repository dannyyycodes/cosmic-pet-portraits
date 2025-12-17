import { motion } from 'framer-motion';
import { Clock, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  name: string;
  price: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  couponDiscount: number;
  giftCertificateCredit: number;
  volumeDiscount: number;
  flashSaleDiscount: number;
  flashSaleEndsIn?: number; // seconds
}

export function OrderSummary({
  items,
  couponDiscount,
  giftCertificateCredit,
  volumeDiscount,
  flashSaleDiscount,
  flashSaleEndsIn,
}: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const totalDiscounts = couponDiscount + volumeDiscount + flashSaleDiscount;
  const creditApplied = Math.min(giftCertificateCredit, subtotal - totalDiscounts);
  const total = Math.max(0, subtotal - totalDiscounts - creditApplied);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/50">
      {/* Flash sale banner */}
      {flashSaleDiscount > 0 && flashSaleEndsIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-2 rounded-lg bg-destructive/20 border border-destructive/30"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Flash Sale!</span>
          </div>
          <div className="flex items-center gap-1 text-destructive">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-mono">{formatTime(flashSaleEndsIn)}</span>
          </div>
        </motion.div>
      )}

      {/* Line items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="text-foreground">${(item.price / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Discounts */}
      {(totalDiscounts > 0 || creditApplied > 0) && (
        <div className="border-t border-border/30 pt-2 space-y-1">
          {volumeDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-500">Volume discount</span>
              <span className="text-green-500">-${(volumeDiscount / 100).toFixed(2)}</span>
            </div>
          )}
          {flashSaleDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-destructive">Flash sale</span>
              <span className="text-destructive">-${(flashSaleDiscount / 100).toFixed(2)}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-500">Coupon discount</span>
              <span className="text-green-500">-${(couponDiscount / 100).toFixed(2)}</span>
            </div>
          )}
          {creditApplied > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-cosmic-gold">Gift certificate</span>
              <span className="text-cosmic-gold">-${(creditApplied / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="border-t border-border/30 pt-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <div className="text-right">
            {totalDiscounts > 0 && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                ${(subtotal / 100).toFixed(2)}
              </span>
            )}
            <span className="text-xl font-bold text-foreground">
              ${(total / 100).toFixed(2)}
            </span>
          </div>
        </div>
        
        {total === 0 && giftCertificateCredit > 0 && (
          <p className="text-sm text-cosmic-gold mt-1">
            Fully covered by gift certificate! 🎁
          </p>
        )}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5" />
          <span>Instant delivery</span>
        </div>
      </div>
    </div>
  );
}
