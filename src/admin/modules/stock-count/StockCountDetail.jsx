import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Send, EyeOff, CheckCircle2 } from "lucide-react";

export default function StockCountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counted, setCounted] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const items = Object.entries(counted)
        .filter(([, val]) => val !== "")
        .map(([itemId, val]) => ({ itemId, countedQuantity: Number(val) }));

      if (items.length > 0) {
        await api.patch(`/stock-counts/${id}/items`, { items });
      }

      const res = await api.post(`/stock-counts/${id}/submit`);
      setSubmitted(res.data);
      toast.success("Submitted for GM review");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit stock count");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!count) return <p className="text-center py-20">Stock count not found</p>;

  const isOpen = count.status === "OPEN";
  const isBlind = count.isBlind;

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
            count.status === "OPEN"
              ? "bg-amber-100 text-amber-600"
              : count.status === "PENDING_REVIEW"
              ? "bg-blue-100 text-blue-600"
              : count.status === "REJECTED"
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {count.status.replace("_", " ")}
        </span>
      </div>

      {isBlind && isOpen && (
        <div className="bg-blue-50 text-blue-700 rounded-2xl p-4 text-sm flex items-center gap-2">
          <EyeOff size={18} />
          This is a blind count — system quantities are hidden while you count. Enter exactly
          what you physically see; the comparison happens after you submit.
        </div>
      )}

      {submitted && (
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <CheckCircle2 className="mx-auto text-blue-600 mb-4" size={56} />
          <h2 className="text-xl font-bold mb-2">Submitted for GM Review</h2>
          <p className="text-slate-500 mb-6">
            Nothing has changed in your stock yet — a General Manager needs to review and
            approve this count before any correction is applied.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-500">Discrepancies Found</p>
              <p className="text-xl font-bold">{submitted.discrepancyCount}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-500">Possible Shrinkage Value</p>
              <p className="text-xl font-bold text-red-600">
                UGX {submitted.totalShrinkageValue.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/stock-count")}
            className="mt-6 text-blue-600 underline text-sm"
          >
            Back to Stock Counts
          </button>
        </div>
      )}

      {!submitted && (
        <div className="bg-white rounded-3xl shadow p-8">
          <div
            className={`grid gap-4 pb-3 border-b font-semibold text-sm text-slate-500 ${
              isBlind ? "grid-cols-[1fr_120px]" : "grid-cols-[1fr_120px_120px]"
            }`}
          >
            <span>Product</span>
            {!isBlind && <span>System Qty</span>}
            <span>Counted</span>
          </div>

          <div className="max-h-[500px] overflow-auto divide-y">
            {count.items.map((item) => (
              <div
                key={item.id}
                className={`grid gap-4 py-3 items-center ${
                  isBlind ? "grid-cols-[1fr_120px]" : "grid-cols-[1fr_120px_120px]"
                }`}
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-slate-400">{item.product.sku}</p>
                </div>
                {!isBlind && (
                  <span className="text-slate-600">
                    {item.systemQuantity} {item.product.unitType}
                  </span>
                )}
                <input
                  type="number"
                  disabled={!isOpen}
                  className="p-2 border rounded-xl disabled:bg-slate-100"
                  value={counted[item.id] ?? ""}
                  onChange={(e) => setCounted({ ...counted, [item.id]: e.target.value })}
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
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
              >
                <Send size={18} /> {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          )}

          {count.status === "REJECTED" && count.rejectionReason && (
            <div className="mt-6 pt-6 border-t bg-red-50 rounded-2xl p-4 text-sm text-red-700">
              Rejected by {count.reviewedBy?.name}: {count.rejectionReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}