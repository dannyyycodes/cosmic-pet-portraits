import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AffiliateStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingBalance: number;
  commissionRate: number;
  status: string;
  referralCode: string;
  pendingCount: number;
  paidCount: number;
}

interface Referral {
  id: string;
  date: string;
  amount: number;
  commission: number;
  status: string;
  paidAt: string | null;
}

interface AffiliateData {
  name: string;
  email: string;
  createdAt: string;
  stripeAccountId: string;
}

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Check localStorage for saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('affiliate_email');
    if (savedEmail) {
      setEmail(savedEmail);
      fetchDashboard(savedEmail);
    }
  }, []);

  const fetchDashboard = async (affiliateEmail: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-dashboard', {
        body: { email: affiliateEmail },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to load dashboard');
        localStorage.removeItem('affiliate_email');
        setIsLoggedIn(false);
        return;
      }

      setAffiliate(data.affiliate);
      setStats(data.stats);
      setReferrals(data.referrals);
      setIsLoggedIn(true);
      localStorage.setItem('affiliate_email', affiliateEmail);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchDashboard(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('affiliate_email');
    setIsLoggedIn(false);
    setAffiliate(null);
    setStats(null);
    setReferrals([]);
    setEmail('');
  };

  const copyReferralLink = () => {
    if (!stats) return;
    const link = `${window.location.origin}/ref/${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto py-12">
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold/20 to-amber-500/20 border border-gold/30 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-semibold">Affiliate Portal</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-foreground via-gold to-foreground bg-clip-text text-transparent mb-4">
            {isLoggedIn ? `Welcome, ${affiliate?.name}` : 'Affiliate Dashboard'}
          </h1>
          {isLoggedIn && (
            <p className="text-lg text-muted-foreground">
              Track your referrals and earnings
            </p>
          )}
        </motion.div>

        {/* Login Form */}
        {!isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Access Your Dashboard
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-background/80 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Not an affiliate yet?{' '}
              <Link to="/become-affiliate" className="text-gold hover:underline">
                Apply here
              </Link>
            </p>
          </motion.div>
        )}

        {/* Dashboard Content */}
        {isLoggedIn && stats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Status Banner */}
            {stats.status !== 'active' && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Complete Stripe Setup</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is pending. Complete Stripe onboarding to start earning.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gold" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendingBalance)}</p>
                <p className="text-sm text-muted-foreground">Pending Payout</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-nebula-purple/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400/20 to-rose-600/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.commissionRate}%</p>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Your Referral Link
              </h3>
              <div className="flex items-center gap-3 p-3 bg-background/80 rounded-xl border border-border/30">
                <code className="flex-1 text-sm text-gold break-all font-mono">
                  {window.location.origin}/ref/{stats.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 hover:bg-muted rounded-lg transition-colors border border-border/50"
                >
                  <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Share this link with your audience. You'll earn {stats.commissionRate}% commission on every sale!
              </p>
            </div>

            {/* Recent Referrals */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Recent Referrals
                </h3>
                <Button variant="ghost" size="sm" onClick={() => fetchDashboard(email)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No referrals yet. Share your link to start earning!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-sm font-medium text-muted-foreground pb-3">Date</th>
                        <th className="text-right text-sm font-medium text-muted-foreground pb-3">Sale Amount</th>
                        <th className="text-right text-sm font-medium text-muted-foreground pb-3">Commission</th>
                        <th className="text-center text-sm font-medium text-muted-foreground pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral) => (
                        <tr key={referral.id} className="border-b border-border/30 last:border-0">
                          <td className="py-3 text-sm text-foreground">
                            {formatDate(referral.date)}
                          </td>
                          <td className="py-3 text-sm text-foreground text-right">
                            {formatCurrency(referral.amount)}
                          </td>
                          <td className="py-3 text-sm text-gold font-medium text-right">
                            +{formatCurrency(referral.commission)}
                          </td>
                          <td className="py-3 text-center">
                            {referral.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="text-center">
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out of dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
