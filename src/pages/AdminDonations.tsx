import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { toast } from "sonner";
import { Heart, Download, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface DonationRow {
  id: string;
  stripe_session_id: string;
  charity_id: string;
  charity_name: string;
  order_amount_cents: number;
  donation_base_cents: number;
  donation_bonus_cents: number;
  donation_total_cents: number;
  currency: string;
  customer_email: string | null;
  status: "pending" | "paid" | "refunded" | "void";
  paid_at: string | null;
  paid_reference: string | null;
  created_at: string;
}

interface SummaryRow {
  charity_id: string;
  charity_name: string;
  pending_cents: number;
  paid_cents: number;
  count_pending: number;
  count_paid: number;
  currency: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() })
    .format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("admin_token");
  if (!token) throw new Error("Not authenticated");
  const headers = new Headers(init.headers);
  headers.set("X-Admin-Token", token);
  headers.set("Content-Type", "application/json");
  if (SUPABASE_KEY) headers.set("apikey", SUPABASE_KEY);
  return fetch(`${SUPABASE_URL}/functions/v1/admin-donations${path}`, { ...init, headers });
}

export default function AdminDonations() {
  const [month, setMonth] = useState<string>(currentMonth());
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("pending");
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [markPaidRef, setMarkPaidRef] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleAuthFailure = useCallback((response: Response): boolean => {
    if (response.status === 401) {
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_email");
      toast.error("Session expired. Please log in again.");
      window.location.href = "/admin/login";
      return true;
    }
    return false;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const listParams = new URLSearchParams();
      if (statusFilter !== "all") listParams.set("status", statusFilter);
      if (month) listParams.set("month", month);

      const summaryParams = new URLSearchParams();
      if (month) summaryParams.set("month", month);

      const [listResp, summaryResp] = await Promise.all([
        authedFetch(`?action=list&${listParams.toString()}`),
        authedFetch(`?action=summary&${summaryParams.toString()}`),
      ]);

      if (handleAuthFailure(listResp) || handleAuthFailure(summaryResp)) return;
      if (!listResp.ok || !summaryResp.ok) throw new Error("Failed to load donations");

      const listJson = await listResp.json();
      const summaryJson = await summaryResp.json();

      setDonations(listJson.donations ?? []);
      setSummary(summaryJson.summary ?? []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("[AdminDonations] load failed:", err);
      toast.error("Failed to load donations");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, month, handleAuthFailure]);

  useEffect(() => { loadData(); }, [loadData]);

  const totals = useMemo(() => {
    const all = summary.reduce(
      (acc, s) => {
        acc.pending_cents += s.pending_cents;
        acc.paid_cents += s.paid_cents;
        acc.count_pending += s.count_pending;
        acc.count_paid += s.count_paid;
        return acc;
      },
      { pending_cents: 0, paid_cents: 0, count_pending: 0, count_paid: 0 },
    );
    return all;
  }, [summary]);

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = donations.filter(d => d.status === "pending").map(d => d.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleMarkPaid = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one donation");
      return;
    }
    const trimmedRef = markPaidRef.trim();
    if (!trimmedRef) {
      toast.error("Paste the bank/PayPal/transfer reference so we can audit the payout later");
      return;
    }

    if (!confirm(`Mark ${selectedIds.size} donation(s) as paid under reference "${trimmedRef}"? This cannot be undone.`)) {
      return;
    }

    setMarkingPaid(true);
    try {
      const resp = await authedFetch("?action=mark-paid", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds), paid_reference: trimmedRef }),
      });
      if (handleAuthFailure(resp)) return;
      if (!resp.ok) throw new Error("Mark-paid failed");
      const json = await resp.json();
      toast.success(`Marked ${json.updated} donation(s) paid`);
      setMarkPaidRef("");
      await loadData();
    } catch (err) {
      console.error("[AdminDonations] mark-paid failed:", err);
      toast.error("Failed to mark donations paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  const exportCSV = () => {
    if (donations.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = [
      "id",
      "created_at",
      "charity_id",
      "charity_name",
      "order_amount_cents",
      "donation_base_cents",
      "donation_bonus_cents",
      "donation_total_cents",
      "currency",
      "customer_email",
      "status",
      "paid_at",
      "paid_reference",
      "stripe_session_id",
    ];
    const csvEscape = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      let s = String(v);
      // Defuse spreadsheet formula injection: prefix cells starting with =, +, -, @, tab, or CR with a single quote.
      // https://owasp.org/www-community/attacks/CSV_Injection
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = donations.map(d => header.map(k => csvEscape((d as unknown as Record<string, unknown>)[k])).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations_${month}_${statusFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display" style={{ color: "#3d2f2a" }}>
              Charity Donations
            </h1>
            <p className="text-sm" style={{ color: "#9a8578" }}>
              10% of every order + any add-on. Export at month-end, pay manually, paste the reference below.
            </p>
          </div>
          <div className="flex gap-2">
            <CosmicButton onClick={loadData} disabled={isLoading} variant="secondary">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </CosmicButton>
            <CosmicButton onClick={exportCSV} variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </CosmicButton>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-sm" style={{ color: "#6e6259" }}>
            Month:{" "}
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="ml-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: "#e8ddd0", background: "white" }}
            />
          </label>
          <label className="text-sm" style={{ color: "#6e6259" }}>
            Status:{" "}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | "pending" | "paid")}
              className="ml-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: "#e8ddd0", background: "white" }}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            title="Pending this month"
            value={formatMoney(totals.pending_cents)}
            subtitle={`${totals.count_pending} order${totals.count_pending === 1 ? "" : "s"}`}
          />
          <StatCard
            icon={CheckCircle2}
            title="Paid this month"
            value={formatMoney(totals.paid_cents)}
            subtitle={`${totals.count_paid} order${totals.count_paid === 1 ? "" : "s"}`}
          />
          <StatCard
            icon={Heart}
            title="Total this month"
            value={formatMoney(totals.pending_cents + totals.paid_cents)}
            subtitle={`${totals.count_pending + totals.count_paid} orders`}
          />
        </div>

        {/* Per-charity rollup */}
        {summary.length > 0 && (
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e8ddd0" }}>
            <h2 className="text-lg font-display mb-3" style={{ color: "#3d2f2a" }}>
              By charity — {month}
            </h2>
            <div className="space-y-2">
              {summary.map(s => (
                <div
                  key={s.charity_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b last:border-b-0"
                  style={{ borderColor: "#f3eadb" }}
                >
                  <div>
                    <p className="font-medium" style={{ color: "#3d2f2a" }}>{s.charity_name}</p>
                    <p className="text-xs" style={{ color: "#9a8578" }}>{s.charity_id}</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span style={{ color: "#bf524a" }}>
                      Pending: <strong>{formatMoney(s.pending_cents, s.currency)}</strong> ({s.count_pending})
                    </span>
                    <span style={{ color: "#6e6259" }}>
                      Paid: <strong>{formatMoney(s.paid_cents, s.currency)}</strong> ({s.count_paid})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mark-paid action bar */}
        {statusFilter === "pending" && donations.length > 0 && (
          <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center" style={{ border: "1px solid #e8ddd0" }}>
            <button
              onClick={selectAllPending}
              className="text-sm underline"
              style={{ color: "#c4a265" }}
              type="button"
            >
              Select all pending ({donations.filter(d => d.status === "pending").length})
            </button>
            <input
              value={markPaidRef}
              onChange={e => setMarkPaidRef(e.target.value)}
              placeholder="Bank/PayPal reference (required)"
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#e8ddd0", background: "white" }}
            />
            <CosmicButton
              onClick={handleMarkPaid}
              disabled={markingPaid || selectedIds.size === 0 || !markPaidRef.trim()}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark {selectedIds.size} paid
            </CosmicButton>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8ddd0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#faf6ef" }}>
                <tr>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>
                    {statusFilter === "pending" && <span className="sr-only">Select</span>}
                  </th>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>Date</th>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>Charity</th>
                  <th className="p-3 text-right" style={{ color: "#6e6259" }}>Order</th>
                  <th className="p-3 text-right" style={{ color: "#6e6259" }}>Donation</th>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>Email</th>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>Status</th>
                  <th className="p-3 text-left" style={{ color: "#6e6259" }}>Ref</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-6 text-center" style={{ color: "#9a8578" }}>Loading…</td></tr>
                )}
                {!isLoading && donations.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center" style={{ color: "#9a8578" }}>No donations in this window</td></tr>
                )}
                {donations.map(d => {
                  const isSelected = selectedIds.has(d.id);
                  const isPending = d.status === "pending";
                  return (
                    <tr key={d.id} className="border-t" style={{ borderColor: "#f3eadb" }}>
                      <td className="p-3">
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(d.id)}
                            aria-label={`Select donation ${d.id}`}
                          />
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: "#6e6259" }}>
                        {formatDate(d.created_at)}
                      </td>
                      <td className="p-3" style={{ color: "#3d2f2a" }}>{d.charity_name}</td>
                      <td className="p-3 text-right tabular-nums" style={{ color: "#6e6259" }}>
                        {formatMoney(d.order_amount_cents, d.currency)}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium" style={{ color: "#bf524a" }}>
                        {formatMoney(d.donation_total_cents, d.currency)}
                        {d.donation_bonus_cents > 0 && (
                          <span className="block text-xs" style={{ color: "#9a8578" }}>
                            (+{formatMoney(d.donation_bonus_cents, d.currency)} bonus)
                          </span>
                        )}
                      </td>
                      <td className="p-3" style={{ color: "#6e6259" }}>{d.customer_email || "—"}</td>
                      <td className="p-3">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{
                            background: d.status === "paid" ? "#e6f4ea" : d.status === "pending" ? "#fff4e0" : "#fde8e8",
                            color: d.status === "paid" ? "#1e6e32" : d.status === "pending" ? "#8a5a00" : "#a12121",
                          }}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs" style={{ color: "#9a8578" }}>
                        {d.paid_reference || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
