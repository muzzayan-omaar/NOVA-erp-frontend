import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Save, CheckCircle2, AlertTriangle } from "lucide-react";

export default function StockCountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counted, setCounted] = useState({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stock-counts/${id}`);
      setCount(res.data);

      const initial = {};
      res.data.items.forEach((item) => {
        initial[item.id] = item.countedQuantity ?? "";
      });
      setCounted(initial);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock count");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [id]);

  const handleSave = async () => {
    const items = Object.entries(counted)
      .filter(([, val]) => val !== "")
      .map(([itemId, val]) => ({ itemId, countedQuantity: Number(val) }));

    if (items.length === 0) {
      toast.error("Enter at least one counted quantity first");
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/stock-counts/${id}/items`, { items });
      toast.success("Counts saved");
      fetchCount();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save counts");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const items = Object.entries(counted)
        .filter(([, val]) => val !== "")
        .map(([itemId, val]) => ({ itemId, countedQuantity: Number(val) }));

      if (items.length > 0) {
        await api.patch(`/stock-counts/${id}/items`, { items });
      }

      const res = await api.post(`/stock-counts/${id}/complete`);
      setResult(res.data);
      toast.success("Stock count completed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete stock count");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <p className="text-center py-20">Loading...</p>;
  }

  if (!count) {
    return <p className="text-center py-20">Stock count not found</p>;
  }

  const isOpen = count.status === "OPEN";

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin/stock-count")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Stock Counts
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{count.store?.name} — Stock Count</h1>
          <p className="text-slate-500 text-sm">
            Started by {count.createdBy?.name} · {new Date(count.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isOpen ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
          }`}
        >
          {count.status}
        </span>
      </div>

      {result && (
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {result.totalShrinkageValue > 0 ? (
              <>
                <AlertTriangle className="text-red-600" /> Shrinkage Found
              </>
            ) : (
              <>
                <CheckCircle2 className="text-green-600" /> Count Complete
              </>
            )}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Missing Stock Value</p>
              <p className="text-2xl font-bold text-red-600">
                UGX {result.totalShrinkageValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Excess Stock Value</p>
              <p className="text-2xl font-bold text-green-600">
                UGX {result.totalOverageValue.toLocaleString()}
              </p>
            </div>
          </div>

          {result.discrepancies.length > 0 && (
            <div className="space-y-2">
              {result.discrepancies.map((d, i) => (
                <div key={i} className="flex justify-between text-sm border-b py-2">
                  <span>{d.productName}</span>
                  <span className={d.variance < 0 ? "text-red-600" : "text-green-600"}>
                    {d.variance > 0 ? "+" : ""}
                    {d.variance} (sys {d.systemQuantity} → counted {d.countedQuantity})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && (
        <div className="bg-white rounded-3xl shadow p-8">
          <div className="grid grid-cols-[1fr_120px_120px] gap-4 pb-3 border-b font-semibold text-sm text-slate-500">
            <span>Product</span>
            <span>System Qty</span>
            <span>Counted</span>
          </div>

          <div className="max-h-[500px] overflow-auto divide-y">
            {count.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_120px_120px] gap-4 py-3 items-center">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-slate-400">{item.product.sku}</p>
                </div>
                <span className="text-slate-600">
                  {item.systemQuantity} {item.product.unitType}
                </span>
                <input
                  type="number"
                  disabled={!isOpen}
                  className="p-2 border rounded-xl disabled:bg-slate-100"
                  value={counted[item.id] ?? ""}
                  onChange={(e) =>
                    setCounted({ ...counted, [item.id]: e.target.value })
                  }
                  placeholder="—"
                />
              </div>
            ))}
          </div>

          {isOpen && (
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-200 py-4 rounded-2xl font-semibold disabled:opacity-50"
              >
                <Save size={18} /> {saving ? "Saving..." : "Save Progress"}
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
              >
                {completing ? "Completing..." : "Complete Count"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}