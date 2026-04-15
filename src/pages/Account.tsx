import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { NoIndex } from "@/components/NoIndex";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Gift,
  Users,
  Mail,
  LogOut,
  ExternalLink,
  Copy,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  XCircle,
  MessageCircle,
  Heart,
  Sparkles,
} from "lucide-react";

interface CustomerData {
  reports: Array<{
    id: string;
    pet_name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
    payment_status: string;
    created_at: string;
    share_token: string | null;
    portrait_url: string | null;
  }>;
  affiliate: {
    id: string;
    referral_code: string;
    total_referrals: number;
    total_earnings_cents: number;
    pending_balance_cents: number;
    status: string;
    commission_rate: number;
  } | null;
  gifts: Array<{
    id: string;
    code: string;
    amount_cents: number;
    recipient_name: string | null;
    recipient_email: string | null;
    is_redeemed: boolean;
    created_at: string;
    gift_tier: string | null;
    gift_message: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    pet_name: string;
    status: string;
    created_at: string;
    cancelled_at: string | null;
    next_send_at: string;
    pet_report_id: string | null;
  }>;
  emailPreferences: {
    isSubscribed: boolean;
    subscribedAt: string;
  } | null;
}

interface CompatibilityRow {
  id: string;
  status: "pending" | "generating" | "ready" | "failed";
  share_token: string;
  created_at: string;
  pet_a: { id: string; pet_name: string; pet_photo_url: string | null };
  pet_b: { id: string; pet_name: string; pet_photo_url: string | null };
  reading_content: { headline?: string } | null;
}

function PetAvatarMini({ url, fallback }: { url?: string | null; fallback?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.25), rgba(191,82,74,0.15))', border: '2px solid #FFFDF5' }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold" style={{ color: '#a07c3a' }}>{fallback || '🐾'}</span>
      )}
    </div>
  );
}

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [emailSubscribed, setEmailSubscribed] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [compatibilities, setCompatibilities] = useState<CompatibilityRow[]>([]);
  const [householdCredits, setHouseholdCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-data");

      if (error) throw error;

      setCustomerData(data);
      if (data.emailPreferences) {
        setEmailSubscribed(data.emailPreferences.isSubscribed);
      }

      // Cross-pet compatibility readings — RLS policy on pet_compatibilities
      // lets an authenticated user read rows where email matches their JWT.
      const email = (user?.email || "").toLowerCase();
      if (email) {
        const { data: compatRows } = await supabase
          .from("pet_compatibilities")
          .select(`
            id, status, share_token, created_at, reading_content,
            pet_a:pet_reports!pet_report_a_id(id, pet_name, pet_photo_url),
            pet_b:pet_reports!pet_report_b_id(id, pet_name, pet_photo_url)
          `)
          .eq("email", email)
          .order("created_at", { ascending: false });
        setCompatibilities((compatRows ?? []) as unknown as CompatibilityRow[]);

        // Pooled household chat credits (set by soul-chat on first chat).
        const { data: creditRow } = await supabase
          .from("chat_credits")
          .select("credits_remaining, is_unlimited")
          .eq("email", email)
          .is("order_id", null)
          .maybeSingle();
        if (creditRow) {
          setHouseholdCredits(creditRow.is_unlimited ? -1 : creditRow.credits_remaining ?? 0);
        }
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
      toast({
        title: "Error loading data",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleEmailToggle = async (subscribed: boolean) => {
    setUpdatingEmail(true);
    try {
      if (!subscribed) {
        await supabase.functions.invoke("unsubscribe", {
          body: { email: user?.email },
        });
      }
      setEmailSubscribed(subscribed);
      toast({
        title: subscribed ? "Subscribed to emails" : "Unsubscribed from emails",
        description: subscribed
          ? "You'll receive cosmic updates and tips."
          : "You won't receive marketing emails anymore.",
      });
    } catch (err) {
      console.error("Error updating email preferences:", err);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancellingSubId(subscriptionId);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId },
      });

      if (error) throw error;

      // Update local state
      setCustomerData(prev => prev ? {
        ...prev,
        subscriptions: prev.subscriptions.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, status: 'cancelled', cancelled_at: new Date().toISOString() }
            : sub
        ),
      } : null);

      toast({
        title: "Subscription cancelled",
        description: "You will no longer receive weekly horoscopes for this pet.",
      });
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getTierLabel = (tier: string | null, amount: number) => {
    if (tier === 'portrait') return 'Portrait Package';
    if (tier === 'essential') return 'Essential Reading';
    if (amount >= 5000) return 'Portrait Package';
    return 'Essential Reading';
  };

  if (loading || dataLoading) {
    return (
      <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-pulse" style={{ color: '#9a8578' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">
      <NoIndex />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>My Account</h1>
            <p style={{ color: '#9a8578' }}>{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 font-medium transition-opacity hover:opacity-80"
            style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6" style={{ background: '#faf6ef', border: '1px solid #e8ddd0', borderRadius: '10px' }}>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="bonds" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Bonds</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Horoscopes</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Gifts</span>
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Affiliate</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Your Cosmic Reports</h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>All your pet astrology readings in one place</p>
              </div>
              <div className="p-6 pt-4">
                {customerData?.reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#9a8578' }} />
                    <p className="mb-4" style={{ color: '#9a8578' }}>No reports yet</p>
                    <button
                      onClick={() => navigate("/checkout")}
                      className="px-6 py-3 font-medium transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    >
                      Get Your First Reading
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pooled SoulSpeak balance — only shown once we have a household credit row */}
                    {householdCredits !== null && (
                      <div className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.12), rgba(191,82,74,0.08))', border: '1.5px solid rgba(196,162,101,0.35)' }}>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" style={{ color: '#a07c3a' }} />
                          <span className="text-sm" style={{ color: '#5a4a42', fontFamily: "'DM Serif Display', Georgia, serif" }}>
                            SoulSpeak pool · {householdCredits === -1
                              ? "Unlimited"
                              : `${Math.floor(householdCredits / 50)} messages left across your pets`}
                          </span>
                        </div>
                      </div>
                    )}
                    {customerData?.reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                      >
                        <div className="flex items-center gap-3">
                          {report.portrait_url && (
                            <img src={report.portrait_url} alt={report.pet_name}
                              className="w-12 h-12 rounded-full object-cover"
                              style={{ border: '2px solid #c4a265' }} />
                          )}
                          <div>
                            <h3 className="font-medium" style={{ color: '#3d2f2a' }}>{report.pet_name}</h3>
                            <p className="text-sm" style={{ color: '#9a8578' }}>
                              {report.species} {report.breed && `• ${report.breed}`}
                            </p>
                            <p className="text-xs" style={{ color: '#9a8578' }}>
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/soul-chat.html?id=${report.id}${report.share_token ? '&token=' + report.share_token : ''}`}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all hover:opacity-90 no-underline"
                            style={{ background: 'white', border: '1.5px solid #c4a265', color: '#a07c3a', borderRadius: '10px' }}
                            title={`Talk with ${report.pet_name}'s soul`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">SoulSpeak</span>
                          </a>
                          <button
                            onClick={() => navigate(`/report?id=${report.id}`)}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Bonds Tab — cross-pet compatibility readings */}
          <TabsContent value="bonds" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>
                  Your Cosmic Bonds
                </h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>
                  Cross-pet readings — how two of your souls move through the world together.
                </p>
              </div>
              <div className="p-6 pt-4">
                {compatibilities.length === 0 ? (
                  <div className="text-center py-10 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.08), rgba(191,82,74,0.05))', border: '1.5px dashed rgba(196,162,101,0.35)' }}>
                    <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: '#c4a265' }} />
                    <p className="mb-2" style={{ color: '#3d2f2a', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.05rem' }}>
                      No bond readings yet
                    </p>
                    <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: '#9a8578' }}>
                      {(customerData?.reports.length ?? 0) < 2
                        ? "Unlock a second pet's reading first, then pair any two of them."
                        : "Pair any two of your pets to reveal how they move through the world together."}
                    </p>
                    {(customerData?.reports.length ?? 0) >= 2 && customerData?.reports[0] && (
                      <button
                        onClick={() => navigate(`/report?id=${customerData.reports[0].id}`)}
                        className="px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 inline-flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #c4a265, #bf524a)', color: 'white', border: 'none', borderRadius: '10px' }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Unlock a bond reading
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compatibilities.map(compat => (
                      <div
                        key={compat.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <PetAvatarMini url={compat.pet_a?.pet_photo_url} fallback={compat.pet_a?.pet_name?.[0]} />
                            <PetAvatarMini url={compat.pet_b?.pet_photo_url} fallback={compat.pet_b?.pet_name?.[0]} />
                          </div>
                          <div>
                            <h3 className="font-medium" style={{ color: '#3d2f2a' }}>
                              {compat.pet_a?.pet_name} × {compat.pet_b?.pet_name}
                            </h3>
                            {compat.reading_content?.headline && (
                              <p className="text-xs italic" style={{ color: '#5a4a42', fontFamily: "'DM Serif Display', Georgia, serif" }}>
                                {compat.reading_content.headline}
                              </p>
                            )}
                            <p className="text-xs" style={{ color: '#9a8578' }}>
                              {new Date(compat.created_at).toLocaleDateString()} ·{' '}
                              <span style={{
                                color: compat.status === 'ready' ? '#4a8c6a'
                                  : compat.status === 'failed' ? '#bf524a'
                                  : '#a07c3a'
                              }}>
                                {compat.status === 'ready' ? 'Ready' : compat.status === 'failed' ? 'Refunded or failed' : 'Composing…'}
                              </span>
                            </p>
                          </div>
                        </div>
                        {compat.status === 'ready' ? (
                          <button
                            onClick={() => navigate(`/compatibility?id=${compat.id}`)}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </button>
                        ) : compat.status === 'failed' ? (
                          <span className="text-xs" style={{ color: '#9a8578' }}>—</span>
                        ) : (
                          <span className="text-xs italic" style={{ color: '#a07c3a' }}>
                            Weaving the reading...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Weekly Horoscopes</h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>Your active horoscope subscriptions</p>
              </div>
              <div className="p-6 pt-4">
                {customerData?.subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto mb-4" style={{ color: '#9a8578' }} />
                    <p className="mb-4" style={{ color: '#9a8578' }}>No horoscope subscriptions</p>
                    <p className="text-sm" style={{ color: '#9a8578' }}>
                      Weekly horoscopes are included with Portrait gift tiers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerData?.subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium" style={{ color: '#3d2f2a' }}>{sub.pet_name}</h3>
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={sub.status === 'active'
                                ? { background: '#e8f5e9', color: '#2e7d32' }
                                : { background: '#faf6ef', color: '#9a8578' }
                              }
                            >
                              {sub.status === 'active' ? 'Active' : 'Cancelled'}
                            </span>
                          </div>
                          {sub.status === 'active' && (
                            <div className="flex items-center gap-1 text-sm mt-1" style={{ color: '#9a8578' }}>
                              <Calendar className="w-3 h-3" />
                              Next: {new Date(sub.next_send_at).toLocaleDateString()}
                            </div>
                          )}
                          {sub.cancelled_at && (
                            <p className="text-xs mt-1" style={{ color: '#9a8578' }}>
                              Cancelled on {new Date(sub.cancelled_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.pet_report_id && (
                            <button
                              onClick={() => navigate(`/report?id=${sub.pet_report_id}`)}
                              className="p-2 transition-opacity hover:opacity-70"
                              style={{ color: '#c4a265' }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleCancelSubscription(sub.id)}
                              disabled={cancellingSubId === sub.id}
                              className="p-2 text-red-500 hover:opacity-70 transition-opacity"
                            >
                              {cancellingSubId === sub.id ? (
                                <span className="animate-pulse">...</span>
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Gifts Tab */}
          <TabsContent value="gifts" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Gift Certificates</h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>Gifts you've purchased for others</p>
              </div>
              <div className="p-6 pt-4">
                {customerData?.gifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: '#9a8578' }} />
                    <p className="mb-4" style={{ color: '#9a8578' }}>No gift certificates purchased</p>
                    <button
                      onClick={() => navigate("/gift")}
                      className="px-6 py-3 font-medium transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    >
                      Send a Gift
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerData?.gifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: '#3d2f2a' }}>
                              ${(gift.amount_cents / 100).toFixed(2)}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={gift.is_redeemed
                                ? { background: '#e8f5e9', color: '#2e7d32' }
                                : { background: '#fff8e1', color: '#f9a825' }
                              }
                            >
                              {gift.is_redeemed ? "Redeemed" : "Active"}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: '#9a8578' }}>
                            For: {gift.recipient_name || gift.recipient_email || "Anyone"}
                          </p>
                          <p className="text-xs" style={{ color: '#9a8578' }}>
                            {new Date(gift.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(gift.code, "Gift code")}
                          className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                          style={{ color: '#c4a265' }}
                        >
                          <Copy className="w-4 h-4" />
                          {gift.code}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Affiliate Tab */}
          <TabsContent value="affiliate" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Affiliate Program</h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>Earn by sharing Little Souls</p>
              </div>
              <div className="p-6 pt-4">
                {!customerData?.affiliate ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#9a8578' }} />
                    <p className="mb-2" style={{ color: '#9a8578' }}>You're not an affiliate yet</p>
                    <p className="text-sm mb-4" style={{ color: '#9a8578' }}>
                      Earn {20}% commission on every sale you refer!
                    </p>
                    <button
                      onClick={() => navigate("/become-affiliate")}
                      className="px-6 py-3 font-medium transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                    >
                      Become an Affiliate
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl text-center" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
                        <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: '#c4a265' }} />
                        <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>
                          {customerData.affiliate.total_referrals}
                        </p>
                        <p className="text-xs" style={{ color: '#9a8578' }}>Total Referrals</p>
                      </div>
                      <div className="p-4 rounded-xl text-center" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
                        <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>
                          ${(customerData.affiliate.total_earnings_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs" style={{ color: '#9a8578' }}>Total Earned</p>
                      </div>
                    </div>

                    {/* Pending Balance */}
                    {customerData.affiliate.pending_balance_cents > 0 && (
                      <div className="p-4 rounded-xl" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                        <p className="text-sm" style={{ color: '#f9a825' }}>
                          Pending payout: ${(customerData.affiliate.pending_balance_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Referral Link */}
                    <div className="p-4 rounded-xl" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
                      <p className="text-sm mb-2" style={{ color: '#9a8578' }}>Your referral link:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm px-3 py-2 rounded overflow-x-auto" style={{ background: 'white', color: '#3d2f2a', border: '1px solid #e8ddd0' }}>
                          {window.location.origin}/ref/{customerData.affiliate.referral_code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(
                            `${window.location.origin}/ref/${customerData.affiliate.referral_code}`,
                            "Referral link"
                          )}
                          className="p-2 hover:opacity-80 transition-opacity"
                          style={{ color: '#c4a265' }}
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-center" style={{ color: '#9a8578' }}>
                      Commission rate: {(customerData.affiliate.commission_rate * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }} className="overflow-hidden">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Email Preferences</h2>
                <p className="text-sm mt-1" style={{ color: '#9a8578' }}>Manage your communication settings</p>
              </div>
              <div className="p-6 pt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="marketing-emails" className="font-medium" style={{ color: '#3d2f2a' }}>
                      Marketing emails
                    </label>
                    <p className="text-sm" style={{ color: '#9a8578' }}>
                      Receive tips, updates, and cosmic insights
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={emailSubscribed}
                    onCheckedChange={handleEmailToggle}
                    disabled={updatingEmail}
                  />
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid #e8ddd0' }}>
                  <h4 className="font-medium mb-2" style={{ color: '#3d2f2a' }}>Need help?</h4>
                  <p className="text-sm mb-3" style={{ color: '#9a8578' }}>
                    For refunds, order issues, or questions, email us at:
                  </p>
                  <a
                    href="mailto:hello@littlesouls.app"
                    className="hover:underline"
                    style={{ color: '#c4a265' }}
                  >
                    hello@littlesouls.app
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
