import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpsalesCard } from './UpsalesCard';
import { CouponInput } from './CouponInput';
import { GiftCertificateInput } from './GiftCertificateInput';
import { GiftMessageForm } from './GiftMessageForm';
import { OrderSummary } from './OrderSummary';
import { supabase } from '@/integrations/supabase/client';
import { PetData } from './IntakeWizard';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  product_type: string;
  features: string[];
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
}

interface GiftCertificate {
  id: string;
  code: string;
  amount_cents: number;
  gift_message: string | null;
  purchaser_email: string;
}

interface CheckoutPanelProps {
  petData: PetData;
  onCheckout: (checkoutData: CheckoutData) => void;
  isLoading: boolean;
}

export interface CheckoutData {
  selectedProducts: string[];
  couponId: string | null;
  giftCertificateId: string | null;
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
  totalCents: number;
}

export function CheckoutPanel({ petData, onCheckout, isLoading }: CheckoutPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedGift, setAppliedGift] = useState<GiftCertificate | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [flashSaleEndsIn, setFlashSaleEndsIn] = useState<number>(0);
  const [showFlashSale, setShowFlashSale] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });
      
      if (data) {
        const formattedProducts = data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
        }));
        setProducts(formattedProducts);
        // Select base report by default
        const baseReport = formattedProducts.find(p => p.product_type === 'base_report');
        if (baseReport) {
          setSelectedProducts([baseReport.id]);
        }
      }
    };
    fetchProducts();
  }, []);

  // Flash sale countdown
  useEffect(() => {
    if (!showFlashSale) return;
    const timer = setInterval(() => {
      setFlashSaleEndsIn(prev => {
        if (prev <= 1) {
          setShowFlashSale(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showFlashSale]);

  const handleToggleProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // For main products (base, premium, bundle), only one can be selected
    if (['base_report', 'premium', 'bundle'].includes(product.product_type)) {
      const otherMainIds = products
        .filter(p => ['base_report', 'premium', 'bundle'].includes(p.product_type))
        .map(p => p.id);
      
      setSelectedProducts(prev => {
        const addons = prev.filter(id => !otherMainIds.includes(id));
        return [...addons, productId];
      });
    } else {
      // For addons, toggle
      setSelectedProducts(prev => 
        prev.includes(productId) 
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    }
  };

  // Calculate pricing
  const selectedItems = products.filter(p => selectedProducts.includes(p.id));
  const subtotal = selectedItems.reduce((sum, p) => sum + p.price_cents, 0);
  const basePrice = products.find(p => p.product_type === 'base_report')?.price_cents || 1497;

  // Calculate discounts
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = Math.round(subtotal * appliedCoupon.discount_value / 100);
    } else {
      couponDiscount = appliedCoupon.discount_value;
    }
  }

  // Flash sale: 15% off if active
  const flashSaleDiscount = showFlashSale ? Math.round(subtotal * 0.15) : 0;

  // Volume discount: count main products (bundle counts as 3)
  const mainProduct = selectedItems.find(p => ['base_report', 'premium', 'bundle'].includes(p.product_type));
  const volumeDiscount = mainProduct?.product_type === 'bundle' ? Math.round(basePrice * 0.2) : 0;

  const giftCertificateCredit = appliedGift?.amount_cents || 0;
  
  const totalDiscounts = couponDiscount + volumeDiscount + flashSaleDiscount;
  const creditApplied = Math.min(giftCertificateCredit, subtotal - totalDiscounts);
  const total = Math.max(0, subtotal - totalDiscounts - creditApplied);

  const handleCheckout = () => {
    onCheckout({
      selectedProducts,
      couponId: appliedCoupon?.id || null,
      giftCertificateId: appliedGift?.id || null,
      isGift,
      recipientName,
      recipientEmail,
      giftMessage,
      totalCents: total,
    });
  };

  const orderItems = selectedItems.map(p => ({
    name: p.name,
    price: p.price_cents,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Emotional header */}
      <div className="text-center space-y-2 pb-4 border-b border-border/30">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Unlock {petData.name}'s Cosmic Truth
        </h2>
        <p className="text-muted-foreground text-sm">
          Join 2,000+ pet parents who discovered something profound
        </p>
      </div>

      {/* Value proposition cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">💫</div>
          <p className="text-xs text-muted-foreground">Deepen your bond</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">🔮</div>
          <p className="text-xs text-muted-foreground">Understand their soul</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">❤️</div>
          <p className="text-xs text-muted-foreground">Learn their love language</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">✨</div>
          <p className="text-xs text-muted-foreground">Discover hidden gifts</p>
        </div>
      </div>

      {/* Product selection */}
      <UpsalesCard
        products={products}
        selectedProducts={selectedProducts}
        onToggleProduct={handleToggleProduct}
        basePrice={basePrice}
      />

      {/* Gift toggle */}
      <GiftMessageForm
        isGift={isGift}
        onToggleGift={setIsGift}
        recipientName={recipientName}
        recipientEmail={recipientEmail}
        giftMessage={giftMessage}
        onUpdateRecipientName={setRecipientName}
        onUpdateRecipientEmail={setRecipientEmail}
        onUpdateGiftMessage={setGiftMessage}
      />

      {/* Discounts */}
      <div className="space-y-2">
        <CouponInput
          onApplyCoupon={setAppliedCoupon}
          appliedCoupon={appliedCoupon}
          subtotal={subtotal}
        />
        <GiftCertificateInput
          onApplyGift={setAppliedGift}
          appliedGift={appliedGift}
        />
      </div>

      {/* Order summary */}
      <OrderSummary
        items={orderItems}
        couponDiscount={couponDiscount}
        giftCertificateCredit={giftCertificateCredit}
        volumeDiscount={volumeDiscount}
        flashSaleDiscount={flashSaleDiscount}
        flashSaleEndsIn={showFlashSale ? flashSaleEndsIn : undefined}
      />

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Instant delivery
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Satisfaction guaranteed
        </span>
      </div>

      {/* Checkout button */}
      <Button
        onClick={handleCheckout}
        disabled={selectedProducts.length === 0 || isLoading || (isGift && (!recipientName || !recipientEmail))}
        variant="gold"
        size="xl"
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            />
            Processing...
          </span>
        ) : total === 0 ? (
          <span className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Claim Your Free Reading
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {isGift ? 'Send Gift' : `Reveal ${petData.name}'s Truth`} — ${(total / 100).toFixed(2)}
          </span>
        )}
      </Button>

      {/* Final reassurance */}
      <p className="text-center text-xs text-muted-foreground">
        🔒 Secure checkout powered by Stripe
      </p>
    </motion.div>
  );
}
