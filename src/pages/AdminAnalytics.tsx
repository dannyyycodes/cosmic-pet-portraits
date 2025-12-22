import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, MousePointer, ArrowDown, AlertTriangle } from 'lucide-react';

interface AnalyticsSummary {
  totalPageViews: number;
  scrollDepthData: { depth: string; count: number }[];
  sectionViews: { section: string; count: number }[];
  ctaClicks: { cta: string; count: number }[];
  errors: { message: string; count: number }[];
}

const COLORS = ['#FFD700', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C'];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('7days');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch all analytics data
      const { data, error } = await supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data
      const pageViews = data?.filter(d => d.event_type === 'page_view').length || 0;
      
      // Scroll depth aggregation
      const scrollEvents = data?.filter(d => d.event_type === 'scroll_depth') || [];
      const scrollDepthMap = new Map<number, number>();
      scrollEvents.forEach(e => {
        const depth = (e.event_data as { depth?: number })?.depth || 0;
        scrollDepthMap.set(depth, (scrollDepthMap.get(depth) || 0) + 1);
      });
      const scrollDepthData = [25, 50, 75, 100].map(depth => ({
        depth: `${depth}%`,
        count: scrollDepthMap.get(depth) || 0
      }));

      // Section views aggregation
      const sectionEvents = data?.filter(d => d.event_type === 'section_view') || [];
      const sectionMap = new Map<string, number>();
      sectionEvents.forEach(e => {
        const section = (e.event_data as { section?: string })?.section || 'unknown';
        sectionMap.set(section, (sectionMap.get(section) || 0) + 1);
      });
      const sectionViews = Array.from(sectionMap.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count);

      // CTA clicks aggregation
      const ctaEvents = data?.filter(d => d.event_type === 'cta_click') || [];
      const ctaMap = new Map<string, number>();
      ctaEvents.forEach(e => {
        const cta = (e.event_data as { cta?: string; location?: string })?.cta || 'unknown';
        const location = (e.event_data as { location?: string })?.location || '';
        const key = `${cta} (${location})`;
        ctaMap.set(key, (ctaMap.get(key) || 0) + 1);
      });
      const ctaClicks = Array.from(ctaMap.entries())
        .map(([cta, count]) => ({ cta, count }))
        .sort((a, b) => b.count - a.count);

      // Error aggregation
      const errorEvents = data?.filter(d => d.event_type === 'error') || [];
      const errorMap = new Map<string, number>();
      errorEvents.forEach(e => {
        const message = (e.event_data as { message?: string })?.message || 'unknown';
        errorMap.set(message, (errorMap.get(message) || 0) + 1);
      });
      const errors = Array.from(errorMap.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count);

      setAnalytics({
        totalPageViews: pageViews,
        scrollDepthData,
        sectionViews,
        ctaClicks,
        errors
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Page Analytics</h1>
          <div className="flex gap-2">
            {(['today', '7days', '30days'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalPageViews || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reached 50% Scroll</CardTitle>
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.scrollDepthData.find(d => d.depth === '50%')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.totalPageViews 
                  ? `${Math.round(((analytics.scrollDepthData.find(d => d.depth === '50%')?.count || 0) / analytics.totalPageViews) * 100)}% of visitors`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CTA Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.ctaClicks.reduce((sum, c) => sum + c.count, 0) || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {analytics?.errors.reduce((sum, e) => sum + e.count, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scroll Depth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Scroll Depth Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.scrollDepthData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="depth" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section Views */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Views (Where visitors drop off)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.sectionViews.map((section, i) => {
                  const maxCount = analytics.sectionViews[0]?.count || 1;
                  const percentage = Math.round((section.count / maxCount) * 100);
                  return (
                    <div key={section.section} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{section.section.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{section.count} views</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!analytics?.sectionViews.length) && (
                  <p className="text-muted-foreground text-sm">No section data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.ctaClicks.map((cta, i) => (
                  <div key={cta.cta} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium capitalize">{cta.cta.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-primary font-bold">{cta.count}</span>
                  </div>
                ))}
                {(!analytics?.ctaClicks.length) && (
                  <p className="text-muted-foreground text-sm">No CTA clicks yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        {analytics?.errors.length ? (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Errors Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.errors.map((error, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                    <span className="text-sm">{error.message}</span>
                    <span className="text-sm text-destructive font-bold">{error.count}x</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
