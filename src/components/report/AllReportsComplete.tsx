import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Share2, Star, Heart, Gift, Copy, Check, User, Lock, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GiftInfo {
  includeGift: boolean;
  giftCode: string | null;
}

interface GiftedInfo {
  isGifted: boolean;
  giftedTier: 'basic' | 'premium' | 'vip' | null;
}

interface HoroscopeInfo {
  enabled: boolean;
  petNames: string[];
}

interface AllReportsCompleteProps {
  petNames: string[];
  onViewReports: () => void;
  giftInfo?: GiftInfo;
  giftedInfo?: GiftedInfo;
  horoscopeInfo?: HoroscopeInfo;
  purchaseEmail?: string;
}

export function AllReportsComplete({ petNames, onViewReports, giftInfo, giftedInfo, horoscopeInfo, purchaseEmail }: AllReportsCompleteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  
  // Get the email from sessionStorage if not passed as prop
  const email = purchaseEmail || (() => {
    try {
      return sessionStorage.getItem('cosmic_report_email') || '';
    } catch {
      return '';
    }
  })();
  
  // Show signup prompt for non-logged-in users after a short delay
  useEffect(() => {
    if (!user && email) {
      const timer = setTimeout(() => setShowSignupPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, email]);
  
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

  const handleCreateAccount = async () => {
    if (!email || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsCreatingAccount(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          // User already has an account, try to sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            toast.error('This email already has an account. Please use your existing password.');
          } else {
            toast.success('Welcome back! Signed in successfully.');
            navigate('/account');
          }
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created! Redirecting to your dashboard...');
        // Navigate to account page which shows reports, subscriptions, and gifts
        setTimeout(() => navigate('/account'), 1000);
      }
    } catch (err) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const skipSignup = () => {
    setShowSignupPrompt(false);
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
              className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-cosmic-gold/20 to-nebula-pink/20 border border-cosmic-gold/30 text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-cosmic-gold shrink-0" />
                <h3 className="font-semibold text-foreground text-sm md:text-base">Your Gift Reading is Ready!</h3>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
                You added a gift reading for a friend. Share the link below with them so they can get their own cosmic pet reading!
              </p>
              
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 px-2 md:px-3 py-2 bg-background/50 rounded-lg border border-border/50 font-mono text-xs md:text-sm truncate">
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

          {/* Weekly Horoscope Confirmation - Show if horoscope was added */}
          {horoscopeInfo?.enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
              className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-primary fill-primary shrink-0" />
                <h3 className="font-semibold text-foreground text-sm md:text-base">Weekly Horoscopes Activated! 🌟</h3>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                {horoscopeInfo.petNames.length === 1 
                  ? `You'll receive personalized weekly cosmic guidance for ${horoscopeInfo.petNames[0]} every Sunday!`
                  : `You'll receive personalized weekly cosmic guidance for ${horoscopeInfo.petNames.join(' and ')} every Sunday!`
                }
              </p>
              
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs md:text-sm font-medium text-foreground mb-2">What to expect:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✦ Weekly cosmic forecast tailored to your pet's chart</li>
                  <li>✦ Energy predictions for each day</li>
                  <li>✦ Best times for activities, vet visits, and bonding</li>
                  <li>✦ Special cosmic event alerts (eclipses, retrogrades)</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Your first horoscope will arrive within the next few days!
              </p>
            </motion.div>
          )}

          {/* Gifted Upsells - Show relevant options based on gifted tier */}
          {giftedInfo?.isGifted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mb-6 space-y-3"
            >
              <p className="text-sm text-muted-foreground mb-4">
                🎁 You received this reading as a gift! Here's what you can do next:
              </p>
              
              {/* Gift for a friend - always show */}
              <Button
                onClick={() => navigate('/gift')}
                variant="outline"
                className="w-full justify-start gap-3 p-4 h-auto"
              >
                <Gift className="w-5 h-5 text-cosmic-gold shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Gift a Reading to a Friend</p>
                  <p className="text-xs text-muted-foreground">Share the cosmic love with someone special</p>
                </div>
              </Button>

              {/* Weekly horoscope - show if not VIP and not already purchased */}
              {giftedInfo.giftedTier !== 'vip' && !horoscopeInfo?.enabled && (
                <Button
                  onClick={() => navigate('/intake?mode=discover&upsell=horoscope')}
                  variant="outline"
                  className="w-full justify-start gap-3 p-4 h-auto"
                >
                  <Star className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Get Weekly Horoscopes</p>
                    <p className="text-xs text-muted-foreground">$4.99/month - personalized cosmic guidance</p>
                  </div>
                </Button>
              )}

              {/* Upgrade to VIP - show only if basic or premium */}
              {giftedInfo.giftedTier === 'basic' && (
                <Button
                  onClick={() => navigate('/intake?mode=discover&upsell=portrait')}
                  variant="outline"
                  className="w-full justify-start gap-3 p-4 h-auto"
                >
                  <Sparkles className="w-5 h-5 text-nebula-pink shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Add Cosmic Portrait</p>
                    <p className="text-xs text-muted-foreground">Get an AI-generated cosmic trading card</p>
                  </div>
                </Button>
              )}
            </motion.div>
          )}

          {/* Account Signup Prompt - show for non-logged-in users */}
          {showSignupPrompt && !user && email && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-primary/20 to-nebula-purple/20 border border-primary/30 text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-5 h-5 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground text-sm md:text-base">Create Your Account</h3>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
                Save your reports, manage subscriptions, and access gifts anytime!
              </p>
              
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 bg-background/50 text-muted-foreground text-sm"
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Create a password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                
                <Button
                  onClick={handleCreateAccount}
                  disabled={isCreatingAccount || password.length < 6}
                  variant="cosmic"
                  className="w-full"
                >
                  {isCreatingAccount ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
                
                <button
                  onClick={skipSignup}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Skip for now
                </button>
              </div>
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
                onClick={() => user ? navigate('/account') : navigate('/my-reports')}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Star className="w-4 h-4 mr-2" />
                {user ? 'My Account' : 'My Reports'}
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
            
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline transition-colors"
            >
              Return Home
            </button>
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
