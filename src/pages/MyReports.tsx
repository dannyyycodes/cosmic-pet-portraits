import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Share2, Eye, LogOut, Home, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
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
        text: `Check out ${report.pet_name}'s cosmic personality reading! 🌟`,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <StarfieldBackground />
      
      <div className="relative z-10 min-h-screen px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">My Cosmic Reports</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/account')}
              >
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Reports Grid */}
          {reports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-card/50 border border-border/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No Reports Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                If you purchased before creating an account, tap “Sync purchases” and we’ll pull them in.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="cosmic"
                  size="lg"
                  onClick={() => navigate('/intake')}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your First Report
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
                >
                  Sync purchases
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/account')}
                >
                  View gifts, referrals & weekly updates
                </Button>
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
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cosmic-gold/20 to-primary/20 flex items-center justify-center text-2xl shrink-0">
                      {getSpeciesEmoji(report.species)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {report.pet_name}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {report.breed || report.species}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Created {format(new Date(report.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="cosmic"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(report)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
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
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/intake')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Add Another Pet
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
