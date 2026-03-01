import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }}>
      <div className="p-6 max-w-4xl mx-auto py-12">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-70 mb-8"
          style={{ color: '#9a8578' }}
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
            style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#c4a265' }} />
            <span className="text-sm font-semibold" style={{ color: '#c4a265' }}>Affiliate Portal</span>
          </motion.div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}
          >
            {isLoggedIn ? `Welcome, ${affiliate?.name}` : 'Affiliate Dashboard'}
          </h1>
          {isLoggedIn && (
            <p className="text-lg" style={{ color: '#9a8578' }}>
              Track your referrals and earnings
            </p>
          )}
        </motion.div>

        {/* Login Form */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto rounded-2xl p-8"
            style={{ background: 'white', border: '1px solid #e8ddd0' }}
          >
            <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#3d2f2a' }}>
              Access Your Dashboard
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3d2f2a' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a', focusRingColor: '#c4a265' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3.5 rounded-xl font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Access Dashboard'
                )}
              </button>
            </form>
            <p className="text-sm mt-6 text-center" style={{ color: '#9a8578' }}>
              Not an affiliate yet?{' '}
              <Link to="/become-affiliate" className="hover:underline" style={{ color: '#c4a265' }}>
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
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: '#c4a265' }} />
                <div>
                  <p className="font-medium" style={{ color: '#3d2f2a' }}>Complete Stripe Setup</p>
                  <p className="text-sm" style={{ color: '#9a8578' }}>
                    Your account is pending. Complete Stripe onboarding to start earning.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Earnings */}
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                  >
                    <DollarSign className="w-5 h-5" style={{ color: '#c4a265' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-sm" style={{ color: '#9a8578' }}>Total Earnings</p>
              </div>

              {/* Pending Payout */}
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                  >
                    <Clock className="w-5 h-5" style={{ color: '#6b8f5e' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{formatCurrency(stats.pendingBalance)}</p>
                <p className="text-sm" style={{ color: '#9a8578' }}>Pending Payout</p>
              </div>

              {/* Total Referrals */}
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                  >
                    <Users className="w-5 h-5" style={{ color: '#5a4a42' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{stats.totalReferrals}</p>
                <p className="text-sm" style={{ color: '#9a8578' }}>Total Referrals</p>
              </div>

              {/* Commission Rate */}
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: '#c4a265' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{stats.commissionRate}%</p>
                <p className="text-sm" style={{ color: '#9a8578' }}>Commission Rate</p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#3d2f2a' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#c4a265' }} />
                Your Referral Link
              </h3>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
              >
                <code className="flex-1 text-sm break-all font-mono" style={{ color: '#c4a265' }}>
                  {window.location.origin}/ref/{stats.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ border: '1px solid #e8ddd0' }}
                >
                  <Copy className="w-4 h-4" style={{ color: '#9a8578' }} />
                </button>
              </div>
              <p className="text-sm mt-3" style={{ color: '#9a8578' }}>
                Share this link with your audience. You'll earn {stats.commissionRate}% commission on every sale!
              </p>
            </div>

            {/* Recent Referrals */}
            <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: '#3d2f2a' }}>
                  <Users className="w-5 h-5" style={{ color: '#5a4a42' }} />
                  Recent Referrals
                </h3>
                <button
                  onClick={() => fetchDashboard(email)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: '#5a4a42' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {referrals.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#9a8578' }}>
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No referrals yet. Share your link to start earning!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#f5efe6' }}>
                        <th className="text-left text-sm font-medium px-3 py-3 rounded-l-lg" style={{ color: '#9a8578' }}>Date</th>
                        <th className="text-right text-sm font-medium px-3 py-3" style={{ color: '#9a8578' }}>Sale Amount</th>
                        <th className="text-right text-sm font-medium px-3 py-3" style={{ color: '#9a8578' }}>Commission</th>
                        <th className="text-center text-sm font-medium px-3 py-3 rounded-r-lg" style={{ color: '#9a8578' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral) => (
                        <tr key={referral.id} style={{ borderBottom: '1px solid #e8ddd0' }} className="last:border-0">
                          <td className="py-3 px-3 text-sm" style={{ color: '#5a4a42' }}>
                            {formatDate(referral.date)}
                          </td>
                          <td className="py-3 px-3 text-sm text-right" style={{ color: '#5a4a42' }}>
                            {formatCurrency(referral.amount)}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-right" style={{ color: '#c4a265' }}>
                            +{formatCurrency(referral.commission)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {referral.status === 'paid' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                                style={{ background: 'rgba(107,143,94,0.12)', color: '#6b8f5e' }}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                                style={{ background: 'rgba(196,162,101,0.12)', color: '#c4a265' }}
                              >
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
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: '#9a8578' }}
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
