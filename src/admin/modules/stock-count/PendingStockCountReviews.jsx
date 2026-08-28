import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { Inbox, Check, X as XIcon, ChevronDown, ChevronUp } from "lucide-react";

export default function PendingStockCountReviews() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock-counts/pending/review");
      setCounts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending stock counts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await api.post(`/stock-counts/${id}/approve`);
      toast.success("Approved — stock corrections applied");
      fetchCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      await api.post(`/stock-counts/${id}/reject`, { rejectionReason });
      toast.success("Rejected — no stock changes were made");
      setRejectingId(null);
      setRejectionReason("");
      fetchCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Inbox /> Pending Stock Count Reviews
        </h1>
        <button onClick={fetchCounts} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-medium">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : counts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
            No stock counts waiting for review.
          </div>
        ) : (
          <div className="space-y-4">
            {counts.map((c) => {
              const isExpanded = expandedId === c.id;
              const discrepantItems = c.items.filter((i) => i.variance !== 0);

              return (
                <div key={c.id} className="border rounded-3xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{c.store?.name}</p>
                      <p className="text-sm text-slate-500">
                        Counted by {c.createdBy?.name} ({c.createdBy?.role}) ·{" "}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{c.discrepancyCount} discrepancy(ies)</p>
                      {c.shrinkageValue > 0 && (
                        <p className="font-bold text-red-600">
                          UGX {c.shrinkageValue.toLocaleString()} possible loss
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="flex items-center gap-2 text-sm text-blue-600 mt-4"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isExpanded ? "Hide item breakdown" : "View item breakdown"}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-1 max-h-64 overflow-auto">
                      {c.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex justify-between text-sm py-2 border-b ${
                            item.variance !== 0 ? "bg-red-50 px-2 -mx-2 rounded-lg" : ""
                          }`}
                        >
                          <span>{item.product?.name}</span>
                          <span>
                            System {item.systemQuantity} → Counted {item.countedQuantity}
                            {item.variance !== 0 && (
                              <span className={`ml-2 font-semibold ${item.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                                ({item.variance > 0 ? "+" : ""}{item.variance})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {rejectingId === c.id ? (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <textarea
                        className="w-full p-3 border rounded-2xl text-sm"
                        rows={2}
                        placeholder="Reason for rejecting (optional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(c.id)}
                          disabled={processingId === c.id}
                          className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                          className="flex-1 bg-slate-200 py-3 rounded-2xl font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 mt-4 pt-4 border-t justify-end">
                      <button
                        onClick={() => setRejectingId(c.id)}
                        disabled={processingId === c.id}
                        className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-2 rounded-2xl border border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XIcon size={16} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(c.id)}
                        disabled={processingId === c.id}
                        className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-2xl hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check size={16} />
                        {processingId === c.id ? "Processing..." : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}