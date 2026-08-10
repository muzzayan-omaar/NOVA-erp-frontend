import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { ShieldAlert } from "lucide-react";

const ACTION_STYLES = {
  PAYMENT_VERIFIED: "bg-green-100 text-green-600",
  PAYMENT_REJECTED: "bg-red-100 text-red-600",
  COMPANY_SUSPENDED: "bg-red-100 text-red-600",
  COMPANY_REACTIVATED: "bg-green-100 text-green-600",
  PLAN_CREATED: "bg-blue-100 text-blue-600",
  PLAN_UPDATED: "bg-blue-100 text-blue-600",
  PLAN_RETIRED: "bg-red-100 text-red-600",
  PLAN_REACTIVATED: "bg-green-100 text-green-600",
  INVESTIGATION_STARTED: "bg-amber-100 text-amber-700",
  BROADCAST_SENT: "bg-purple-100 text-purple-600",
};

export default function PlatformAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    platformApi
      .get("/platform/audit-log")
      .then((res) => setLogs(res.data))
      .catch(() => toast.error("Failed to load audit log"))
      .finally(() => setLoading(false));
  }, []);

  const actions = ["All", ...new Set(logs.map((l) => l.action))];
  const filtered = filter === "All" ? logs : logs.filter((l) => l.action === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <ShieldAlert /> Platform Audit Log
      </h1>

      <select
        className="p-3 border rounded-2xl"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        {actions.map((a) => (
          <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
        ))}
      </select>

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-slate-500">No entries</p>
        ) : (
          <div className="divide-y">
            {filtered.map((log) => (
              <div key={log.id} className="py-4 px-2">
                <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ACTION_STYLES[log.action] || "bg-slate-100 text-slate-600"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  By <span className="font-medium">{log.platformAdmin?.name}</span>
                </p>
                {log.metadata && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}