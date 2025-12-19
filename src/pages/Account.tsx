import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  TrendingUp
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
  }>;
  emailPreferences: {
    isSubscribed: boolean;
    subscribedAt: string;
  } | null;
}

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [emailSubscribed, setEmailSubscribed] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <StarfieldBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <CosmicButton variant="secondary" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </CosmicButton>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
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
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Your Cosmic Reports</CardTitle>
                <CardDescription>All your pet astrology readings in one place</CardDescription>
              </CardHeader>
              <CardContent>
                {customerData?.reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No reports yet</p>
                    <CosmicButton onClick={() => navigate("/intake")}>
                      Get Your First Reading
                    </CosmicButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerData?.reports.map((report) => (
                      <div 
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div>
                          <h3 className="font-medium text-foreground">{report.pet_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {report.species} {report.breed && `• ${report.breed}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <CosmicButton 
                          size="sm"
                          onClick={() => navigate(`/report?id=${report.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </CosmicButton>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gifts Tab */}
          <TabsContent value="gifts" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Gift Certificates</CardTitle>
                <CardDescription>Gifts you've purchased for others</CardDescription>
              </CardHeader>
              <CardContent>
                {customerData?.gifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No gift certificates purchased</p>
                    <CosmicButton onClick={() => navigate("/gift")}>
                      Send a Gift
                    </CosmicButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerData?.gifts.map((gift) => (
                      <div 
                        key={gift.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              ${(gift.amount_cents / 100).toFixed(2)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              gift.is_redeemed 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {gift.is_redeemed ? "Redeemed" : "Active"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            For: {gift.recipient_name || gift.recipient_email || "Anyone"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(gift.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(gift.code, "Gift code")}
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                        >
                          <Copy className="w-4 h-4" />
                          {gift.code}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliate Tab */}
          <TabsContent value="affiliate" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Affiliate Program</CardTitle>
                <CardDescription>Earn by sharing AstroPets</CardDescription>
              </CardHeader>
              <CardContent>
                {!customerData?.affiliate ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">You're not an affiliate yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Earn {20}% commission on every sale you refer!
                    </p>
                    <CosmicButton onClick={() => navigate("/become-affiliate")}>
                      Become an Affiliate
                    </CosmicButton>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-background/50 border border-border/30 text-center">
                        <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {customerData.affiliate.total_referrals}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Referrals</p>
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 border border-border/30 text-center">
                        <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          ${(customerData.affiliate.total_earnings_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                      </div>
                    </div>

                    {/* Pending Balance */}
                    {customerData.affiliate.pending_balance_cents > 0 && (
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                          Pending payout: ${(customerData.affiliate.pending_balance_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Referral Link */}
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <p className="text-sm text-muted-foreground mb-2">Your referral link:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background/50 px-3 py-2 rounded text-foreground overflow-x-auto">
                          {window.location.origin}/ref/{customerData.affiliate.referral_code}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(
                            `${window.location.origin}/ref/${customerData.affiliate.referral_code}`,
                            "Referral link"
                          )}
                          className="p-2 text-primary hover:text-primary/80"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Commission rate: {(customerData.affiliate.commission_rate * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Manage your communication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="text-foreground">
                      Marketing emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
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

                <div className="pt-4 border-t border-border/30">
                  <h4 className="font-medium text-foreground mb-2">Need help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    For refunds, order issues, or questions, email us at:
                  </p>
                  <a 
                    href="mailto:support@astropets.cloud"
                    className="text-primary hover:text-primary/80"
                  >
                    support@astropets.cloud
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
