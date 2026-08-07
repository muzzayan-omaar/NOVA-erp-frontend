import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ShieldAlert, RefreshCw } from "lucide-react";

const ACTION_STYLES = {
  SALE_VOIDED: "bg-red-100 text-red-600",
  SALE_REFUNDED: "bg-amber-100 text-amber-600",
  PRODUCT_DELETED: "bg-red-100 text-red-600",
  PRODUCT_CREATED: "bg-green-100 text-green-600",
  PRODUCT_UPDATED: "bg-blue-100 text-blue-600",
  INVENTORY_ADJUSTED: "bg-purple-100 text-purple-600",
  PAYROLL_CREATED: "bg-blue-100 text-blue-600",
};

export default function AuditModule() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("All");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/audit");
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = ["All", ...new Set(logs.map((l) => l.action))];

  const filteredLogs =
    actionFilter === "All" ? logs : logs.filter((l) => l.action === actionFilter);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert />
            Audit Log
          </h1>
          <p className="text-slate-500">
            Every void, refund, and sensitive change — visible only to you.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex gap-2 items-center"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4">
        <select
          className="p-4 border rounded-2xl"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {loading ? (
          <p className="text-center">Loading audit log...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No records found</p>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ACTION_STYLES[log.action] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>

                    <p className="text-sm text-slate-600 mt-2">
                      By <span className="font-semibold">{log.user?.name}</span>{" "}
                      ({log.user?.role})
                      {log.store?.name ? ` · ${log.store.name}` : ""}
                    </p>

                    {log.metadata?.reason && (
                      <p className="text-sm text-slate-500 mt-1">
                        Reason: {log.metadata.reason}
                      </p>
                    )}

                    {log.metadata?.authorizedByName && (
                      <p className="text-sm text-slate-500">
                        Authorized by:{" "}
                        <span className="font-medium">
                          {log.metadata.authorizedByName}
                        </span>
                      </p>
                    )}

                    {log.metadata?.totalAmount != null && (
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        UGX {Number(log.metadata.totalAmount).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}