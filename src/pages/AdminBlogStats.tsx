import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Eye, 
  MousePointerClick, 
  TrendingUp,
  RefreshCw,
  Plus,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { StatCard } from '@/components/admin/StatCard';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  cta_clicks: number;
  conversions: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  category: string | null;
  species: string | null;
}

interface BlogTopic {
  id: string;
  topic: string;
  species: string;
  category: string;
  is_used: boolean;
}

export default function AdminBlogStats() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      // Fetch blog posts via admin-data endpoint
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data?action=blog`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          sessionStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to load data');
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setTopics(data.topics || []);
    } catch (err) {
      console.error('Failed to load blog stats:', err);
      toast.error('Failed to load blog stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePosts = async (count: number) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-blogs', {
        body: { count },
      });

      if (error) throw error;
      
      toast.success(`Generated ${data.generated?.length || 0} blog posts!`);
      loadData();
    } catch (err) {
      console.error('Failed to generate posts:', err);
      toast.error('Failed to generate posts');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Draft';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalClicks = posts.reduce((acc, p) => acc + (p.cta_clicks || 0), 0);
  const totalConversions = posts.reduce((acc, p) => acc + (p.conversions || 0), 0);
  const publishedPosts = posts.filter(p => p.is_published).length;
  const unusedTopics = topics.filter(t => !t.is_used).length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Blog Analytics</h1>
            <p className="text-muted-foreground">
              {unusedTopics} topics remaining in queue
            </p>
          </div>
          <div className="flex gap-3">
            <CosmicButton
              variant="secondary"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </CosmicButton>
            <CosmicButton
              onClick={() => handleGeneratePosts(3)}
              disabled={isGenerating}
            >
              <Plus className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate 3 Posts'}
            </CosmicButton>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Posts"
            value={posts.length}
            subtitle={`${publishedPosts} published`}
            icon={FileText}
            iconColor="text-cosmic-purple"
            iconBg="bg-cosmic-purple/20"
          />
          <StatCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            icon={Eye}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/20"
          />
          <StatCard
            title="CTA Clicks"
            value={totalClicks.toLocaleString()}
            subtitle={totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}% CTR` : '0% CTR'}
            icon={MousePointerClick}
            iconColor="text-cosmic-gold"
            iconBg="bg-cosmic-gold/20"
          />
          <StatCard
            title="Conversions"
            value={totalConversions.toLocaleString()}
            subtitle={totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(1)}% rate` : '0% rate'}
            icon={TrendingUp}
            iconColor="text-green-400"
            iconBg="bg-green-500/20"
          />
          <StatCard
            title="Topics Queue"
            value={unusedTopics}
            subtitle={`${topics.length - unusedTopics} used`}
            icon={Calendar}
            iconColor="text-pink-400"
            iconBg="bg-pink-500/20"
          />
        </div>

        {/* Posts Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">All Blog Posts</h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-cosmic-gold" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No blog posts yet</p>
              <CosmicButton
                className="mt-4"
                onClick={() => handleGeneratePosts(5)}
                disabled={isGenerating}
              >
                Generate First 5 Posts
              </CosmicButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Views</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">CTA Clicks</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Conversions</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">CTR</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Published</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => {
                    const ctr = post.views > 0 ? ((post.cta_clicks / post.views) * 100).toFixed(1) : '0';
                    return (
                      <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {post.species} • {post.category}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-foreground font-medium">{post.views || 0}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-foreground font-medium">{post.cta_clicks || 0}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-foreground font-medium">{post.conversions || 0}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(ctr) > 5 
                              ? 'bg-green-500/20 text-green-400'
                              : parseFloat(ctr) > 2
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {ctr}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            post.is_published
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {post.is_published ? formatDate(post.published_at) : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cosmic-gold hover:text-cosmic-gold/80 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
