import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { X, ShieldAlert } from "lucide-react";

export default function VoidRefundModal({ sale, mode, onClose, onSuccess }) {
  // mode is either "void" or "refund"
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = mode === "void" ? "Request Void" : "Request Refund";
  const endpoint = mode === "void" ? "request-void" : "request-refund";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/sales/${sale.id}/${endpoint}`, { reason });

      toast.success(
        mode === "void"
          ? "Void request sent — awaiting manager approval"
          : "Refund request sent — awaiting manager approval"
      );
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || `Failed to submit ${mode} request`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-600">
            <ShieldAlert size={22} />
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Sale <span className="font-mono">{sale.id.slice(0, 8)}</span> — UGX{" "}
          {Number(sale.totalAmount || 0).toLocaleString()}. This sale will be
          frozen and sent to your manager for approval — you can keep working
          right away.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Reason
            </label>
            <textarea
              className="w-full p-3 border rounded-2xl mt-1"
              rows={3}
              placeholder={
                mode === "void"
                  ? "e.g. Rang up wrong item, customer changed mind"
                  : "e.g. Customer returned goods"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}