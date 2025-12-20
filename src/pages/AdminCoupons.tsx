import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  Tag, 
  Plus, 
  Trash2, 
  RefreshCw,
  Search,
  Percent,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Edit2,
  X
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  min_purchase_cents: number | null;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formMinPurchase, setFormMinPurchase] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const adminToken = sessionStorage.getItem('admin_token');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-coupons?action=list', {
        headers: { 'X-Admin-Token': adminToken! }
      });
      
      if (error) throw error;
      setCoupons(data?.coupons || []);
      setFilteredCoupons(data?.coupons || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = coupons;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCoupons(filtered);
  }, [searchTerm, coupons]);

  const resetForm = () => {
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormMaxUses('');
    setFormMinPurchase('');
    setFormExpiresAt('');
    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discount_type as 'percentage' | 'fixed');
    setFormDiscountValue(
      coupon.discount_type === 'percentage' 
        ? coupon.discount_value.toString() 
        : (coupon.discount_value / 100).toString()
    );
    setFormMaxUses(coupon.max_uses?.toString() || '');
    setFormMinPurchase(coupon.min_purchase_cents ? (coupon.min_purchase_cents / 100).toString() : '');
    setFormExpiresAt(coupon.expires_at ? coupon.expires_at.split('T')[0] : '');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formDiscountValue) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const discountValue = formDiscountType === 'percentage' 
        ? parseFloat(formDiscountValue)
        : parseFloat(formDiscountValue) * 100; // Convert to cents

      const payload = {
        code: formCode.toUpperCase().trim(),
        discount_type: formDiscountType,
        discount_value: discountValue,
        max_uses: formMaxUses ? parseInt(formMaxUses) : null,
        min_purchase_cents: formMinPurchase ? parseFloat(formMinPurchase) * 100 : null,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        is_active: true,
      };

      const action = editingCoupon ? 'update' : 'create';
      const { error } = await supabase.functions.invoke(`admin-coupons?action=${action}`, {
        headers: { 'X-Admin-Token': adminToken! },
        body: editingCoupon ? { couponId: editingCoupon.id, ...payload } : payload,
      });

      if (error) throw error;

      toast.success(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (couponId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-coupons?action=toggle', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { couponId, isActive: !isActive },
      });

      if (error) throw error;
      toast.success(isActive ? 'Coupon deactivated' : 'Coupon activated');
      loadData();
    } catch (err) {
      toast.error('Failed to update coupon');
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-coupons?action=delete', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { couponId },
      });

      if (error) throw error;
      toast.success('Coupon deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `$${(coupon.discount_value / 100).toFixed(2)}`;
  };

  const activeCount = coupons.filter(c => c.is_active).length;
  const totalUses = coupons.reduce((acc, c) => acc + c.current_uses, 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Coupons</h1>
            <p className="text-muted-foreground">Create and manage discount codes</p>
          </div>
          <div className="flex gap-3">
            <CosmicButton onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </CosmicButton>
            <CosmicButton variant="secondary" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </CosmicButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Coupons"
            value={coupons.length}
            icon={Tag}
            iconColor="text-cosmic-purple"
            iconBg="bg-cosmic-purple/20"
          />
          <StatCard
            title="Active"
            value={activeCount}
            icon={CheckCircle}
            iconColor="text-green-400"
            iconBg="bg-green-500/20"
          />
          <StatCard
            title="Total Uses"
            value={totalUses}
            icon={Users}
            iconColor="text-cosmic-gold"
            iconBg="bg-cosmic-gold/20"
          />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code..."
            className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
          />
        </div>

        {/* Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Uses</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Min Purchase</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Expires</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" />
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No coupons found. Create your first coupon!
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded text-cosmic-gold font-bold">
                          {coupon.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-3 h-3" />
                          ) : (
                            <DollarSign className="w-3 h-3" />
                          )}
                          {formatDiscount(coupon)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            coupon.is_active 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {coupon.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {coupon.current_uses}
                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {coupon.min_purchase_cents 
                          ? `$${(coupon.min_purchase_cents / 100).toFixed(0)}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {coupon.expires_at 
                          ? new Date(coupon.expires_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggested Codes */}
        <div className="mt-6 p-4 bg-cosmic-purple/10 border border-cosmic-purple/30 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2">💡 Suggested Coupon Ideas</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 bg-card rounded text-muted-foreground">LAUNCH20 (20% off)</span>
            <span className="px-2 py-1 bg-card rounded text-muted-foreground">WELCOME10 (10% off first)</span>
            <span className="px-2 py-1 bg-card rounded text-muted-foreground">HOLIDAY25 (25% seasonal)</span>
            <span className="px-2 py-1 bg-card rounded text-muted-foreground">VIP15 (15% loyalty)</span>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH20"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground uppercase"
                  disabled={!!editingCoupon}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percentage' ? '20' : '5.00'}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                    min="0"
                    max={formDiscountType === 'percentage' ? '100' : undefined}
                    step={formDiscountType === 'percentage' ? '1' : '0.01'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Min Purchase ($)
                  </label>
                  <input
                    type="number"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(e.target.value)}
                    placeholder="None"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <CosmicButton onClick={handleSave} className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                </CosmicButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
