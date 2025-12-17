import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface GiftMessageFormProps {
  isGift: boolean;
  onToggleGift: (isGift: boolean) => void;
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
  onUpdateRecipientName: (name: string) => void;
  onUpdateRecipientEmail: (email: string) => void;
  onUpdateGiftMessage: (message: string) => void;
}

const giftTemplates = [
  { icon: '🎂', text: "Happy Birthday! May the stars align for all your wishes!" },
  { icon: '🎄', text: "Wishing you cosmic joy this holiday season!" },
  { icon: '💝', text: "Because your pet deserves to know how special they are!" },
  { icon: '✨', text: "A little cosmic magic for you and your furry friend!" },
];

export function GiftMessageForm({
  isGift,
  onToggleGift,
  recipientName,
  recipientEmail,
  giftMessage,
  onUpdateRecipientName,
  onUpdateRecipientEmail,
  onUpdateGiftMessage,
}: GiftMessageFormProps) {
  return (
    <div className="space-y-3">
      {/* Gift toggle */}
      <button
        onClick={() => onToggleGift(!isGift)}
        className={cn(
          "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
          isGift
            ? "border-cosmic-gold bg-cosmic-gold/10"
            : "border-border/50 bg-card/20 hover:border-cosmic-gold/30"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          isGift ? "bg-cosmic-gold text-cosmic-gold-foreground" : "bg-muted/50 text-muted-foreground"
        )}>
          <Gift className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <h4 className="font-medium text-foreground">Send as a Gift</h4>
          <p className="text-sm text-muted-foreground">
            Include a personalized message & special reveal
          </p>
        </div>
        <div className={cn(
          "w-12 h-6 rounded-full transition-all p-0.5",
          isGift ? "bg-cosmic-gold" : "bg-muted"
        )}>
          <motion.div
            animate={{ x: isGift ? 24 : 0 }}
            className="w-5 h-5 rounded-full bg-white shadow-sm"
          />
        </div>
      </button>

      {/* Gift form */}
      {isGift && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 p-4 rounded-xl bg-card/30 border border-cosmic-gold/20"
        >
          <div className="flex items-center gap-2 text-cosmic-gold">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Gift Delivery Details</span>
          </div>

          <div className="grid gap-3">
            <Input
              value={recipientName}
              onChange={(e) => onUpdateRecipientName(e.target.value)}
              placeholder="Recipient's Name"
              className="h-11 bg-card/50 border-border/50"
            />
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => onUpdateRecipientEmail(e.target.value)}
              placeholder="Recipient's Email"
              className="h-11 bg-card/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              Personal Message (optional)
            </label>
            <Textarea
              value={giftMessage}
              onChange={(e) => onUpdateGiftMessage(e.target.value)}
              placeholder="Write a heartfelt message..."
              className="min-h-[80px] bg-card/50 border-border/50 resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {giftMessage.length}/200
            </p>
          </div>

          {/* Quick templates */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick templates:</p>
            <div className="flex flex-wrap gap-2">
              {giftTemplates.map((template, i) => (
                <button
                  key={i}
                  onClick={() => onUpdateGiftMessage(template.text)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {template.icon}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
