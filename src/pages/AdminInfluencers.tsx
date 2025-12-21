import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Plus, Send, Sparkles, Mail, Globe, Instagram, 
  ExternalLink, Trash2, Edit2, Filter, RefreshCw, Users,
  CheckCircle, Clock, XCircle, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Prospect {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  niche: string | null;
  follower_estimate: string | null;
  content_summary: string | null;
  status: string;
  pitch_content: string | null;
  pitch_sent_at: string | null;
  notes: string | null;
  source: string | null;
  priority: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  replied: "bg-green-500/20 text-green-400 border-green-500/30",
  converted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Clock className="w-3 h-3" />,
  contacted: <Send className="w-3 h-3" />,
  replied: <MessageSquare className="w-3 h-3" />,
  converted: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

export default function AdminInfluencers() {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchNiche, setSearchNiche] = useState("dog influencer");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [manualProspect, setManualProspect] = useState({
    name: "",
    email: "",
    website: "",
    instagram: "",
    niche: "dog",
    notes: "",
  });

  useEffect(() => {
    loadProspects();
  }, [statusFilter]);

  const loadProspects = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/influencer-prospects`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/influencer-prospects?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setProspects(data.prospects || []);
      }
    } catch (error) {
      console.error("Error loading prospects:", error);
      toast({
        title: "Error",
        description: "Failed to load prospects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchInfluencers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "e.g., 'pet blogger contact email' or 'dog mom influencer'",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-influencers", {
        body: { query: searchQuery, niche: searchNiche },
      });

      if (error) throw error;
      
      if (data.success) {
        setSearchResults(data.prospects || []);
        toast({
          title: "Search Complete",
          description: `Found ${data.prospects?.length || 0} potential influencers`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for influencers",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const addProspectsFromSearch = async () => {
    if (searchResults.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke("influencer-prospects", {
        body: { action: "bulk-add", prospects: searchResults },
      });

      if (error) throw error;
      
      toast({
        title: "Prospects Added",
        description: `Added ${data.added} new prospects to your CRM`,
      });
      
      setSearchResults([]);
      loadProspects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add prospects",
        variant: "destructive",
      });
    }
  };

  const addManualProspect = async () => {
    if (!manualProspect.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("influencer-prospects", {
        body: { action: "add", prospect: { ...manualProspect, source: "manual" } },
      });

      if (error) throw error;
      
      toast({ title: "Prospect Added" });
      setShowAddDialog(false);
      setManualProspect({ name: "", email: "", website: "", instagram: "", niche: "dog", notes: "" });
      loadProspects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generatePitch = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setGeneratingPitch(true);
    setGeneratedPitch("");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-influencer-pitch", {
        body: { prospect },
      });

      if (error) throw error;
      
      if (data.success) {
        setGeneratedPitch(data.pitch);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate pitch",
        variant: "destructive",
      });
    } finally {
      setGeneratingPitch(false);
    }
  };

  const sendOutreach = async () => {
    if (!selectedProspect?.email || !generatedPitch) {
      toast({
        title: "Missing Information",
        description: "Email and pitch content are required",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-influencer-outreach", {
        body: {
          prospectId: selectedProspect.id,
          email: selectedProspect.email,
          pitch: generatedPitch,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Email Sent!",
          description: `Outreach email sent to ${selectedProspect.email}`,
        });
        setSelectedProspect(null);
        setGeneratedPitch("");
        loadProspects();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const updateProspectStatus = async (id: string, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("influencer-prospects", {
        body: { action: "update", prospect: { id, status } },
      });

      if (error) throw error;
      loadProspects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteProspect = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/influencer-prospects`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Prospect Deleted" });
        loadProspects();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const stats = {
    total: prospects.length,
    new: prospects.filter(p => p.status === "new").length,
    contacted: prospects.filter(p => p.status === "contacted").length,
    replied: prospects.filter(p => p.status === "replied").length,
    converted: prospects.filter(p => p.status === "converted").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Influencer Outreach</h1>
            <p className="text-muted-foreground">Find and recruit pet influencers as affiliates</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Prospect Manually</DialogTitle>
                <DialogDescription>Enter influencer details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  value={manualProspect.name}
                  onChange={(e) => setManualProspect(p => ({ ...p, name: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={manualProspect.email}
                  onChange={(e) => setManualProspect(p => ({ ...p, email: e.target.value }))}
                />
                <Input
                  placeholder="Website"
                  value={manualProspect.website}
                  onChange={(e) => setManualProspect(p => ({ ...p, website: e.target.value }))}
                />
                <Input
                  placeholder="Instagram handle"
                  value={manualProspect.instagram}
                  onChange={(e) => setManualProspect(p => ({ ...p, instagram: e.target.value }))}
                />
                <Select value={manualProspect.niche} onValueChange={(v) => setManualProspect(p => ({ ...p, niche: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="exotic">Exotic Pets</SelectItem>
                    <SelectItem value="general">General Pets</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Notes"
                  value={manualProspect.notes}
                  onChange={(e) => setManualProspect(p => ({ ...p, notes: e.target.value }))}
                />
                <Button onClick={addManualProspect} className="w-full">Add Prospect</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "New", value: stats.new, color: "text-blue-400" },
            { label: "Contacted", value: stats.contacted, color: "text-yellow-400" },
            { label: "Replied", value: stats.replied, color: "text-green-400" },
            { label: "Converted", value: stats.converted, color: "text-purple-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="prospects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prospects" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Prospects
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prospects" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadProspects} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading prospects...</div>
            ) : prospects.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No prospects yet. Use the "Find New" tab to search for influencers.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {prospects.map((prospect) => (
                  <Card key={prospect.id} className="bg-card/50 hover:bg-card/70 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{prospect.name}</h3>
                            <Badge className={`${statusColors[prospect.status]} flex items-center gap-1`}>
                              {statusIcons[prospect.status]}
                              {prospect.status}
                            </Badge>
                            {prospect.niche && (
                              <Badge variant="outline" className="text-xs">{prospect.niche}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {prospect.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {prospect.email}
                              </span>
                            )}
                            {prospect.website && (
                              <a href={prospect.website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-primary">
                                <Globe className="w-3 h-3" />
                                Website
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {prospect.instagram && (
                              <a href={`https://instagram.com/${prospect.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-pink-400">
                                <Instagram className="w-3 h-3" />
                                @{prospect.instagram}
                              </a>
                            )}
                          </div>
                          {prospect.content_summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{prospect.content_summary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={prospect.status} 
                            onValueChange={(v) => updateProspectStatus(prospect.id, v)}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          {prospect.email && prospect.status === "new" && (
                            <Button
                              size="sm"
                              onClick={() => generatePitch(prospect)}
                              className="flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Pitch
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteProspect(prospect.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search for Influencers
                </CardTitle>
                <CardDescription>
                  Search the web for pet influencers, bloggers, and content creators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="e.g., 'pet blogger contact email' or 'dog mom influencer blog'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && searchInfluencers()}
                  />
                  <Select value={searchNiche} onValueChange={setSearchNiche}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog influencer">Dogs</SelectItem>
                      <SelectItem value="cat influencer">Cats</SelectItem>
                      <SelectItem value="pet blogger">General Pets</SelectItem>
                      <SelectItem value="exotic pet">Exotic Pets</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={searchInfluencers} disabled={searching}>
                    {searching ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Try these searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "pet influencer blog contact",
                      "dog mom blogger email",
                      "cat instagram influencer contact",
                      "pet youtube channel email",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSearchQuery(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Search Results ({searchResults.length})</CardTitle>
                    <Button onClick={addProspectsFromSearch}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add All to CRM
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.map((result, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-background/50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                            {result.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{result.email}</span>}
                            {result.website && (
                              <a href={result.website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-primary">
                                <Globe className="w-3 h-3" />Website
                              </a>
                            )}
                            {result.instagram && <span className="flex items-center gap-1"><Instagram className="w-3 h-3" />@{result.instagram}</span>}
                          </div>
                          {result.content_summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{result.content_summary}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Pitch Dialog */}
        <Dialog open={!!selectedProspect} onOpenChange={(open) => !open && setSelectedProspect(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate & Send Pitch</DialogTitle>
              <DialogDescription>
                AI-generated personalized email for {selectedProspect?.name}
              </DialogDescription>
            </DialogHeader>
            
            {generatingPitch ? (
              <div className="py-8 text-center">
                <Sparkles className="w-8 h-8 mx-auto text-primary animate-pulse mb-2" />
                <p className="text-muted-foreground">Generating personalized pitch...</p>
              </div>
            ) : generatedPitch ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">To:</label>
                  <p className="text-muted-foreground">{selectedProspect?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Content:</label>
                  <Textarea
                    value={generatedPitch}
                    onChange={(e) => setGeneratedPitch(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => generatePitch(selectedProspect!)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button onClick={sendOutreach} disabled={sendingEmail}>
                    {sendingEmail ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No pitch generated yet.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
