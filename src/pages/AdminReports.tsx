import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { 
  FileText, 
  RefreshCw, 
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface PetReport {
  id: string;
  pet_name: string;
  email: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_location: string | null;
  payment_status: string | null;
  occasion_mode: string | null;
  created_at: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<PetReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PetReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data?action=reports`,
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

      const { reports: data } = await response.json();
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    let filtered = reports;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.species.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.payment_status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, reports]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const paidCount = reports.filter(r => r.payment_status === 'paid').length;
  const pendingCount = reports.filter(r => r.payment_status === 'pending').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Pet Reports</h1>
            <p className="text-muted-foreground">Manage all cosmic birth charts</p>
          </div>
          <CosmicButton
            variant="secondary"
            onClick={loadReports}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </CosmicButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Reports"
            value={reports.length}
            icon={FileText}
            iconColor="text-cosmic-purple"
            iconBg="bg-cosmic-purple/20"
          />
          <StatCard
            title="Paid Reports"
            value={paidCount}
            subtitle={`$${(paidCount * 19.99).toFixed(2)} revenue`}
            icon={CheckCircle}
            iconColor="text-green-400"
            iconBg="bg-green-500/20"
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={Clock}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by pet name, email, or species..."
              className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Pet</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Owner</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Species</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Birth Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Occasion</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cosmic-gold" />
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{report.pet_name}</p>
                          <p className="text-xs text-muted-foreground">{report.breed || 'Unknown breed'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground truncate max-w-[200px]">{report.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-foreground">{report.species}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {report.birth_date || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          report.payment_status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {getStatusIcon(report.payment_status)}
                          {report.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground capitalize">
                          {report.occasion_mode || 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/report?id=${report.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cosmic-gold hover:text-cosmic-gold/80 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
