import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import {
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  X,
  Zap,
  Gift,
} from 'lucide-react';

interface RedeemCode {
  id: string;
  code: string;
  tier: string;
  max_uses: number | null;
  current_uses: number;
  created_by: string;
  note: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminRedeemCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formTier, setFormTier] = useState<'basic' | 'premium' | 'hardcover'>('premium');
  const [formMaxUses, setFormMaxUses] = useState('1');
  const [formNote, setFormNote] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const adminToken = sessionStorage.getItem('admin_token');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-redeem-codes?action=list', {
        headers: { 'X-Admin-Token': adminToken! },
      });
      if (error) throw error;
      setCodes(data?.codes || []);
      setFilteredCodes(data?.codes || []);
    } catch (err) {
      console.error('Failed to load redeem codes:', err);
      toast.error('Failed to load redeem codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = codes;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.note || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCodes(filtered);
  }, [searchTerm, codes]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'LS-';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const handleCreate = async () => {
    if (!formCode.trim()) {
      toast.error('Code is required');
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-redeem-codes?action=create', {
        headers: { 'X-Admin-Token': adminToken! },
        body: {
          code: formCode.trim().toUpperCase(),
          tier: formTier,
          max_uses: parseInt(formMaxUses) || 1,
          note: formNote.trim() || null,
          expires_at: formExpiresAt || null,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'Failed to create code');
        return;
      }
      toast.success('Redeem code created!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Failed to create code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickCreate = async (note: string, maxUses: number) => {
    const code = generateCode();
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-redeem-codes?action=create', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { code, tier: 'premium', max_uses: maxUses, note },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'Failed to create code');
        return;
      }
      toast.success(`Code created: ${code}`);
      loadData();
    } catch (err) {
      toast.error('Failed to create code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await supabase.functions.invoke('admin-redeem-codes?action=toggle', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { id, is_active: !currentActive },
      });
      toast.success(currentActive ? 'Code deactivated' : 'Code activated');
      loadData();
    } catch (err) {
      toast.error('Failed to toggle code');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this redeem code?')) return;
    try {
      await supabase.functions.invoke('admin-redeem-codes?action=delete', {
        headers: { 'X-Admin-Token': adminToken! },
        body: { id },
      });
      toast.success('Code deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete code');
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormTier('premium');
    setFormMaxUses('1');
    setFormNote('');
    setFormExpiresAt('');
  };

  const activeCodes = codes.filter(c => c.is_active);
  const totalRedemptions = codes.reduce((sum, c) => sum + c.current_uses, 0);

  const tierLabel = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Reading';
      case 'premium': return 'Reading + Portrait';
      case 'hardcover': return 'Hardcover Book';
      default: return tier;
    }
  };

  const tierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'hardcover': return { background: 'rgba(196,162,101,0.15)', color: '#c4a265' };
      case 'premium': return { background: 'rgba(107,143,94,0.12)', color: '#6b8f5e' };
      default: return { background: '#faf6ef', color: '#5a4a42' };
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}
            >
              Redeem Codes
            </h1>
            <p className="text-sm" style={{ color: '#9a8578' }}>
              Create free reading codes for testing and giveaways
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadData()}
              className="p-2 rounded-lg transition-colors"
              style={{ border: '1px solid #e8ddd0', color: '#5a4a42' }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { resetForm(); setFormCode(generateCode()); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)' }}
            >
              <Plus className="w-4 h-4" />
              Create Code
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Codes', value: codes.length, icon: Ticket },
            { label: 'Active Codes', value: activeCodes.length, icon: CheckCircle },
            { label: 'Total Redemptions', value: totalRedemptions, icon: Gift },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl"
              style={{ background: 'white', border: '1px solid #e8ddd0' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: '#c4a265' }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{stat.value}</p>
              <p className="text-sm" style={{ color: '#9a8578' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Create */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
        >
          <Zap className="w-5 h-5" style={{ color: '#c4a265' }} />
          <span className="text-sm font-medium" style={{ color: '#3d2f2a' }}>Quick Create:</span>
          <button
            onClick={() => handleQuickCreate('Test code', 1)}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'white', border: '1px solid #e8ddd0', color: '#5a4a42' }}
          >
            Test Code (1 use)
          </button>
          <button
            onClick={() => handleQuickCreate('Giveaway code', 10)}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'white', border: '1px solid #e8ddd0', color: '#5a4a42' }}
          >
            Giveaway Code (10 uses)
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9a8578' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
            style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
            onFocus={(e) => (e.target.style.borderColor = '#c4a265')}
            onBlur={(e) => (e.target.style.borderColor = '#e8ddd0')}
            placeholder="Search codes or notes..."
          />
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', border: '1px solid #e8ddd0' }}
        >
          {isLoading ? (
            <div className="p-8 text-center" style={{ color: '#9a8578' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#9a8578' }}>
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No redeem codes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f5efe6' }}>
                    {['Code', 'Tier', 'Uses', 'Note', 'Status', 'Expires', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold px-4 py-3 uppercase tracking-wider"
                        style={{ color: '#9a8578' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((rc) => (
                    <tr key={rc.id} style={{ borderBottom: '1px solid #f5efe6' }}>
                      <td className="px-4 py-3">
                        <code
                          className="font-mono text-sm font-semibold px-2 py-1 rounded"
                          style={{ background: '#faf6ef', color: '#c4a265' }}
                        >
                          {rc.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={tierBadgeStyle(rc.tier)}
                        >
                          {tierLabel(rc.tier)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#5a4a42' }}>
                        {rc.current_uses}/{rc.max_uses || '∞'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#9a8578' }}>
                        {rc.note || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(rc.id, rc.is_active)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors"
                          style={
                            rc.is_active
                              ? { background: 'rgba(107,143,94,0.12)', color: '#6b8f5e' }
                              : { background: 'rgba(180,80,80,0.1)', color: '#b45050' }
                          }
                        >
                          {rc.is_active ? (
                            <><CheckCircle className="w-3 h-3" /> Active</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#9a8578' }}>
                        {rc.expires_at
                          ? new Date(rc.expires_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(rc.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#9a8578' }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(61,47,42,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: 'white', border: '1px solid #e8ddd0', boxShadow: '0 8px 32px rgba(61,47,42,0.12)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}
                >
                  Create Redeem Code
                </h2>
                <button onClick={() => setShowCreateModal(false)} style={{ color: '#9a8578' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3d2f2a' }}>
                    Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl font-mono tracking-wider outline-none transition-all"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    onFocus={(e) => (e.target.style.borderColor = '#c4a265')}
                    onBlur={(e) => (e.target.style.borderColor = '#e8ddd0')}
                    placeholder="LS-XXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3d2f2a' }}>
                    Tier
                  </label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as 'basic' | 'premium' | 'hardcover')}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                  >
                    <option value="basic">Reading ($27 value)</option>
                    <option value="premium">Reading + Portrait ($35 value)</option>
                    <option value="hardcover">Hardcover Book ($99 value)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#3d2f2a' }}>
                      Max Uses
                    </label>
                    <input
                      type="number"
                      value={formMaxUses}
                      onChange={(e) => setFormMaxUses(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#3d2f2a' }}>
                      Expires
                    </label>
                    <input
                      type="date"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3d2f2a' }}>
                    Note <span style={{ color: '#9a8578', fontWeight: 'normal' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#3d2f2a' }}
                    onFocus={(e) => (e.target.style.borderColor = '#c4a265')}
                    onBlur={(e) => (e.target.style.borderColor = '#e8ddd0')}
                    placeholder="e.g. Testing, Giveaway for @petlover"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                    style={{ border: '1px solid #e8ddd0', color: '#5a4a42', background: 'white' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)' }}
                  >
                    {isSaving ? 'Creating...' : 'Create Code'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
