import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Building2, DollarSign, UserMinus } from "lucide-react";

const STATUS_COLORS = {
  TRIALING: "#3b82f6",
  ACTIVE: "#22c55e",
  EXPIRED: "#ef4444",
  CANCELLED: "#94a3b8",
  NONE: "#e2e8f0",
};

export default function PlatformAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [overviewRes, paymentsRes] = await Promise.all([
        platformApi.get("/platform/analytics/overview"),
        platformApi.get("/platform/payments"),
      ]);
      setOverview(overviewRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading || !overview) {
    return <p className="text-center py-20">Loading...</p>;
  }

  const pieData = Object.entries(overview.subscriptionBreakdown)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  const filteredPayments =
    statusFilter === "All" ? payments : payments.filter((p) => p.status === statusFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <TrendingUp /> Revenue & Analytics
      </h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl shadow p-6">
          <Building2 className="text-blue-600 mb-2" size={22} />
          <p className="text-sm text-slate-500">Total Companies</p>
          <p className="text-2xl font-bold">{overview.totalCompanies}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-6">
          <DollarSign className="text-green-600 mb-2" size={22} />
          <p className="text-sm text-slate-500">Estimated MRR</p>
          <p className="text-2xl font-bold">UGX {overview.estimatedMRR.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-6">
          <UserMinus className="text-red-600 mb-2" size={22} />
          <p className="text-sm text-slate-500">Paid Churn</p>
          <p className="text-2xl font-bold">{overview.paidChurn}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-6">
          <UserMinus className="text-slate-400 mb-2" size={22} />
          <p className="text-sm text-slate-500">Trial Never Converted</p>
          <p className="text-2xl font-bold">{overview.trialChurn}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold mb-4">Subscription Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#cbd5e1"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold mb-4">New Signups (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overview.signupsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Payment History</h2>
          <select
            className="p-2 border rounded-xl text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No payments found</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {filteredPayments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b py-3">
                <div>
                  <p className="font-medium">{p.company?.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.submittedBy?.name} · {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">UGX {Number(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{p.status.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}