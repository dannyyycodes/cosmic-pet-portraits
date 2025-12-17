import { motion } from 'framer-motion';
import { Check, Crown, Star, Sparkles, Gift, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  product_type: string;
  features: string[];
}

interface UpsalesCardProps {
  products: Product[];
  selectedProducts: string[];
  onToggleProduct: (productId: string) => void;
  basePrice: number;
}

const productIcons: Record<string, React.ReactNode> = {
  base_report: <Sparkles className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
  bundle: <Gift className="w-5 h-5" />,
  addon: <Star className="w-5 h-5" />,
};

const productBadges: Record<string, string> = {
  premium: 'MOST POPULAR',
  bundle: 'BEST VALUE',
};

export function UpsalesCard({ products, selectedProducts, onToggleProduct, basePrice }: UpsalesCardProps) {
  const mainProducts = products.filter(p => ['base_report', 'premium', 'bundle'].includes(p.product_type));
  const addons = products.filter(p => p.product_type === 'addon');

  return (
    <div className="space-y-4">
      {/* Main product tiers */}
      <div className="grid gap-3">
        {mainProducts.map((product, index) => {
          const isSelected = selectedProducts.includes(product.id);
          const isPremium = product.product_type === 'premium';
          const isBundle = product.product_type === 'bundle';
          
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onToggleProduct(product.id)}
              className={cn(
                "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                isSelected 
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                  : "border-border/50 bg-card/30 hover:border-primary/50",
                isPremium && "ring-2 ring-cosmic-gold/30",
              )}
            >
              {/* Badge */}
              {productBadges[product.product_type] && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-cosmic-gold text-cosmic-gold-foreground text-xs font-bold rounded-full">
                  {productBadges[product.product_type]}
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Radio/Check */}
                <div className={cn(
                  "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/40"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {productIcons[product.product_type]}
                    </span>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.features.slice(0, 4).map((feature, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-foreground">
                    ${(product.price_cents / 100).toFixed(2)}
                  </div>
                  {product.product_type !== 'base_report' && (
                    <div className="text-xs text-green-500">
                      Save ${((basePrice - product.price_cents + (product.product_type === 'bundle' ? basePrice * 2 : 0)) / 100).toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Add-ons */}
      {addons.length > 0 && (
        <div className="pt-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-cosmic-gold" />
            Enhance Your Reading
          </h4>
          <div className="grid gap-2">
            {addons.map((addon) => {
              const isSelected = selectedProducts.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => onToggleProduct(addon.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    isSelected
                      ? "border-cosmic-gold/50 bg-cosmic-gold/10"
                      : "border-border/30 bg-card/20 hover:border-cosmic-gold/30"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    isSelected ? "border-cosmic-gold bg-cosmic-gold" : "border-muted-foreground/40"
                  )}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-cosmic-gold-foreground" />}
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{addon.name}</span>
                    <p className="text-xs text-muted-foreground">{addon.description}</p>
                  </div>
                  
                  <span className="text-sm font-semibold text-cosmic-gold">
                    +${(addon.price_cents / 100).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
