import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Share2, Eye, LogOut, Home, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PetReport {
  id: string;
  pet_name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  created_at: string;
  payment_status: string | null;
}

export default function MyReports() {
  const [reports, setReports] = useState<PetReport[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, signOut, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        // Ensure any guest purchases get linked to this account
        await supabase.functions.invoke('link-user-reports');

        // Use backend function (service access) to avoid any client-side visibility issues
        const { data, error } = await supabase.functions.invoke('customer-data');
        if (error) throw error;

        const next = (data?.reports || []) as PetReport[];
        const paidReports = next.filter(r => r.payment_status === 'paid' || r.payment_status === 'completed');
        setReports(paidReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        toast.error('Failed to load your reports');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchReports();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/report?id=${reportId}`);
  };

  const handleShare = async (report: PetReport) => {
    if (navigator.share) {
      await navigator.share({
        title: `${report.pet_name}'s Cosmic Report`,
        text: `Check out ${report.pet_name}'s cosmic personality reading!`,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copied to clipboard!');
    }
  };

  const getSpeciesEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      dog: '🐕',
      cat: '🐱',
      rabbit: '🐰',
      hamster: '🐹',
      guinea_pig: '🐹',
      bird: '🐦',
      fish: '🐟',
      reptile: '🦎',
      horse: '🐴',
    };
    return emojis[species] || '🐾';
  };

  if (authLoading || loading) {
    return (
      <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8" style={{ color: '#c4a265' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">

      <div className="relative z-10 min-h-screen px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)' }}
              >
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>My Cosmic Reports</h1>
                <p className="text-sm" style={{ color: '#9a8578' }}>{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => navigate('/account')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
              >
                <User className="w-4 h-4" />
                Account
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: '#9a8578', background: 'transparent', border: 'none' }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Reports Grid */}
          {reports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
              >
                <Sparkles className="w-10 h-10" style={{ color: '#9a8578' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>No Reports Yet</h2>
              <p className="mb-6 max-w-sm mx-auto" style={{ color: '#9a8578' }}>
                If you purchased before creating an account, tap "Sync purchases" and we'll pull them in.
              </p>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => navigate('/intake')}
                  className="flex items-center gap-2 px-8 py-4 font-medium text-lg transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                >
                  <Sparkles className="w-5 h-5" />
                  Get Your First Report
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await supabase.functions.invoke('link-user-reports');
                      const { data } = await supabase.functions.invoke('customer-data');
                      const next = (data?.reports || []) as PetReport[];
                      const paidReports = next.filter(r => r.payment_status === 'paid' || r.payment_status === 'completed');
                      setReports(paidReports);
                    } catch (e) {
                      toast.error('Could not sync purchases');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
                >
                  Sync purchases
                </button>
                <button
                  onClick={() => navigate('/account')}
                  className="text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: '#9a8578', background: 'transparent', border: 'none' }}
                >
                  View gifts, referrals & weekly updates
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-5 transition-all hover:shadow-md"
                  style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                    >
                      {getSpeciesEmoji(report.species)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate" style={{ color: '#3d2f2a' }}>
                        {report.pet_name}
                      </h3>
                      <p className="text-sm capitalize" style={{ color: '#9a8578' }}>
                        {report.breed || report.species}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#9a8578' }}>
                        Created {format(new Date(report.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>
                    <button
                      onClick={() => handleShare(report)}
                      className="p-2 transition-opacity hover:opacity-80"
                      style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA to add more */}
          {reports.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-10"
            >
              <button
                onClick={() => navigate('/intake')}
                className="flex items-center gap-2 mx-auto px-6 py-3 font-medium transition-opacity hover:opacity-80"
                style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
              >
                <Sparkles className="w-4 h-4" />
                Add Another Pet
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
