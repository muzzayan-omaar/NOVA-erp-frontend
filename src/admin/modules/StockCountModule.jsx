import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ClipboardList, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function StockCountModule() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock-counts");
      setCounts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock counts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const startNewCount = async () => {
    try {
      setStarting(true);
      const res = await api.post("/stock-counts", {});
      toast.success("Stock count started");
      navigate(`/admin/stock-count/${res.data.id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to start stock count";
      toast.error(msg);
      if (err?.response?.data?.stockCountId) {
        navigate(`/admin/stock-count/${err.response.data.stockCountId}`);
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList /> Stock Reconciliation
          </h1>
          <p className="text-slate-500">Count physical stock and compare against system records.</p>
        </div>
        <button
          onClick={startNewCount}
          disabled={starting}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={20} /> {starting ? "Starting..." : "Start New Count"}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : counts.length === 0 ? (
          <p className="text-center text-slate-500 py-16">No stock counts yet</p>
        ) : (
          <div className="space-y-3">
            {counts.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/admin/stock-count/${c.id}`)}
                className="border rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:border-blue-400 transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === "OPEN"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {c.status}
                    </span>
                    <p className="font-semibold">{c.store?.name}</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Started by {c.createdBy?.name} · {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  {c.status === "COMPLETED" ? (
                    c.shrinkageCount > 0 ? (
                      <p className="flex items-center gap-2 text-red-600 font-semibold">
                        <AlertTriangle size={18} />
                        {c.shrinkageCount} shrinkage item(s)
                      </p>
                    ) : c.discrepancyCount > 0 ? (
                      <p className="text-amber-600 font-semibold">
                        {c.discrepancyCount} discrepancy(ies)
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle2 size={18} />
                        All matched
                      </p>
                    )
                  ) : (
                    <p className="text-slate-400 text-sm">{c.totalItems} items</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}