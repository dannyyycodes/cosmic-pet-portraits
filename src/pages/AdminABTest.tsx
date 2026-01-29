import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface VariantStats {
  variant: string;
  pageViews: number;
  uniqueVisitors: number;
  ctaClicks: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  clickThroughRate: number;
}

interface EventData {
  ab_variant?: string;
  [key: string]: unknown;
}

const AdminABTest = () => {
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("7d");

  useEffect(() => {
    fetchABTestStats();
  }, [dateRange]);

  const fetchABTestStats = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      if (dateRange === "7d") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === "30d") {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date("2024-01-01");
      }

      const { data: analyticsData, error } = await supabase
        .from("page_analytics")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Process data by variant
      const variantMap: Record<string, VariantStats> = {
        A: { variant: "A", pageViews: 0, uniqueVisitors: 0, ctaClicks: 0, checkoutStarts: 0, purchases: 0, revenue: 0, conversionRate: 0, clickThroughRate: 0 },
        B: { variant: "B", pageViews: 0, uniqueVisitors: 0, ctaClicks: 0, checkoutStarts: 0, purchases: 0, revenue: 0, conversionRate: 0, clickThroughRate: 0 },
        C: { variant: "C", pageViews: 0, uniqueVisitors: 0, ctaClicks: 0, checkoutStarts: 0, purchases: 0, revenue: 0, conversionRate: 0, clickThroughRate: 0 },
      };

      const sessionsByVariant: Record<string, Set<string>> = {
        A: new Set(),
        B: new Set(),
        C: new Set(),
      };

      analyticsData?.forEach((event) => {
        const eventData = event.event_data as EventData | null;
        const variant = (eventData?.ab_variant as string) || "A";
        
        if (!variantMap[variant]) return;

        sessionsByVariant[variant].add(event.session_id);

        if (event.event_type === "page_view" && event.page_path === "/") {
          variantMap[variant].pageViews++;
        }
        if (event.event_type === "cta_click") {
          variantMap[variant].ctaClicks++;
        }
        if (event.event_type === "checkout_start" || event.page_path === "/intake") {
          variantMap[variant].checkoutStarts++;
        }
        if (event.event_type === "purchase_complete") {
          variantMap[variant].purchases++;
        }
      });

      // Calculate metrics
      Object.keys(variantMap).forEach((v) => {
        variantMap[v].uniqueVisitors = sessionsByVariant[v].size;
        variantMap[v].conversionRate = variantMap[v].uniqueVisitors > 0 
          ? (variantMap[v].purchases / variantMap[v].uniqueVisitors) * 100 
          : 0;
        variantMap[v].clickThroughRate = variantMap[v].pageViews > 0 
          ? (variantMap[v].ctaClicks / variantMap[v].pageViews) * 100 
          : 0;
      });

      setStats(Object.values(variantMap));
    } catch (error) {
      console.error("Error fetching A/B test stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerBadge = (variant: string) => {
    const maxConversion = Math.max(...stats.map(s => s.conversionRate));
    if (stats.find(s => s.variant === variant)?.conversionRate === maxConversion && maxConversion > 0) {
      return <Badge className="bg-green-500 text-white ml-2">Leader</Badge>;
    }
    return null;
  };

  const getVariantLabel = (variant: string) => {
    switch (variant) {
      case "A": return "Premium Mystical (Control)";
      case "B": return "Urgent & Emotional";
      case "C": return "Friendly & Fun";
      default: return variant;
    }
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case "A": return "from-purple-600 to-indigo-600";
      case "B": return "from-red-500 to-orange-500";
      case "C": return "from-pink-400 to-cyan-400";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">A/B Test Results</h1>
            <p className="text-muted-foreground">Compare conversion rates across funnel variants</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <Card key={stat.variant} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${getVariantColor(stat.variant)}`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">Variant {stat.variant}</span>
                      {getWinnerBadge(stat.variant)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{getVariantLabel(stat.variant)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" /> Visitors
                        </span>
                        <span className="font-bold">{stat.uniqueVisitors.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" /> CTR
                        </span>
                        <span className="font-bold">{stat.clickThroughRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" /> Purchases
                        </span>
                        <span className="font-bold">{stat.purchases}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-4">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" /> Conversion
                        </span>
                        <span className="text-2xl font-bold">{stat.conversionRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Metric</th>
                        {stats.map((stat) => (
                          <th key={stat.variant} className="text-center py-3 px-4">
                            Variant {stat.variant}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Landing Page Views</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.pageViews.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Unique Visitors</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.uniqueVisitors.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">CTA Clicks</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.ctaClicks.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Click-Through Rate</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.clickThroughRate.toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Checkout Starts</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.checkoutStarts.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Purchases</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4">
                            {stat.purchases}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-3 px-4 font-bold">Conversion Rate</td>
                        {stats.map((stat) => (
                          <td key={stat.variant} className="text-center py-3 px-4 font-bold text-lg">
                            {stat.conversionRate.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Test URLs */}
            <Card>
              <CardHeader>
                <CardTitle>Test URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">A</Badge>
                    <code className="text-sm flex-1">?variant=A</code>
                    <span className="text-sm text-muted-foreground">Premium Mystical (Control)</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <Badge variant="outline" className="border-red-500 text-red-500">B</Badge>
                    <code className="text-sm flex-1">?variant=B</code>
                    <span className="text-sm text-muted-foreground">Urgent & Emotional</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <Badge variant="outline" className="border-cyan-500 text-cyan-500">C</Badge>
                    <code className="text-sm flex-1">?variant=C</code>
                    <span className="text-sm text-muted-foreground">Friendly & Fun</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminABTest;
