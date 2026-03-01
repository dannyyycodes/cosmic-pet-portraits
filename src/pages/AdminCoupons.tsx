import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
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
            <h1 className="text-3xl font-display font-bold" style={{ color: '#3d2f2a' }}>Coupons</h1>
            <p style={{ color: '#9a8578' }}>Create and manage discount codes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #c4a265, #b08d4f)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-all"
              style={{ border: '1px solid #e8ddd0', color: '#3d2f2a', background: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#faf6ef'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Coupons"
            value={coupons.length}
            icon={Tag}
            iconColor="text-[#c4a265]"
            iconBg="bg-[#c4a265]/10"
          />
          <StatCard
            title="Active"
            value={activeCount}
            icon={CheckCircle}
            iconColor="text-[#6b8f5e]"
            iconBg="bg-[#6b8f5e]/10"
          />
          <StatCard
            title="Total Uses"
            value={totalUses}
            icon={Users}
            iconColor="text-[#c4a265]"
            iconBg="bg-[#c4a265]/10"
          />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9a8578' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code..."
            className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
            style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f5efe6', borderBottom: '1px solid #e8ddd0' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Uses</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Min Purchase</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Expires</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: '#3d2f2a' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: '#c4a265' }} />
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center" style={{ color: '#9a8578' }}>
                      No coupons found. Create your first coupon!
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} style={{ borderBottom: '1px solid #e8ddd0' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#faf6ef'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <code className="text-sm px-2 py-1 rounded font-bold" style={{ background: '#faf6ef', color: '#c4a265' }}>
                          {coupon.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1" style={{ color: '#5a4a42' }}>
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
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
                          style={coupon.is_active
                            ? { background: 'rgba(107,143,94,0.12)', color: '#6b8f5e' }
                            : { background: 'rgba(180,90,90,0.12)', color: '#b45a5a' }
                          }
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
                      <td className="px-4 py-3" style={{ color: '#5a4a42' }}>
                        {coupon.current_uses}
                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#5a4a42' }}>
                        {coupon.min_purchase_cents
                          ? `$${(coupon.min_purchase_cents / 100).toFixed(0)}`
                          : <span style={{ color: '#9a8578' }}>-</span>
                        }
                      </td>
                      <td className="px-4 py-3" style={{ color: '#5a4a42' }}>
                        {coupon.expires_at
                          ? new Date(coupon.expires_at).toLocaleDateString()
                          : <span style={{ color: '#9a8578' }}>Never</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#9a8578' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#3d2f2a'; e.currentTarget.style.background = '#faf6ef'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9a8578'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#9a8578' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#b45a5a'; e.currentTarget.style.background = 'rgba(180,90,90,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9a8578'; e.currentTarget.style.background = 'transparent'; }}
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
        <div className="mt-6 p-4 rounded-xl" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#3d2f2a' }}>Suggested Coupon Ideas</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 rounded" style={{ background: 'white', color: '#9a8578' }}>LAUNCH20 (20% off)</span>
            <span className="px-2 py-1 rounded" style={{ background: 'white', color: '#9a8578' }}>WELCOME10 (10% off first)</span>
            <span className="px-2 py-1 rounded" style={{ background: 'white', color: '#9a8578' }}>HOLIDAY25 (25% seasonal)</span>
            <span className="px-2 py-1 rounded" style={{ background: 'white', color: '#9a8578' }}>VIP15 (15% loyalty)</span>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: '#3d2f2a' }}>
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#9a8578' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#faf6ef'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH20"
                  className="w-full px-4 py-3 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                  disabled={!!editingCoupon}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                    Discount Type
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                    Value *
                  </label>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percentage' ? '20' : '5.00'}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    min="0"
                    max={formDiscountType === 'percentage' ? '100' : undefined}
                    step={formDiscountType === 'percentage' ? '1' : '0.01'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                    Max Uses
                  </label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                    Min Purchase ($)
                  </label>
                  <input
                    type="number"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(e.target.value)}
                    placeholder="None"
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3d2f2a' }}>
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 rounded-xl transition-colors"
                  style={{ border: '1px solid #e8ddd0', color: '#3d2f2a', background: 'white' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#faf6ef'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #c4a265, #b08d4f)' }}
                  disabled={isSaving}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  {isSaving ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
