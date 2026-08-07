import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Inbox, RefreshCw, Check, X as XIcon, Clock } from "lucide-react";

export default function PendingRequestsModule() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/pending-requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (saleId) => {
    try {
      setProcessingId(saleId);
      await api.post(`/sales/${saleId}/approve`);
      toast.success("Request approved");
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (saleId) => {
    try {
      setProcessingId(saleId);
      await api.post(`/sales/${saleId}/reject`, { rejectionReason });
      toast.success("Request rejected");
      setRejectingId(null);
      setRejectionReason("");
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Inbox />
            Pending Requests
          </h1>
          <p className="text-slate-500">
            Void and refund requests waiting on your approval.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex gap-2 items-center"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {loading ? (
          <p className="text-center">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-500 py-16">
            <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
            <p>No pending requests — all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((sale) => (
              <div key={sale.id} className="border rounded-3xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.status === "PENDING_VOID"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {sale.status === "PENDING_VOID" ? "VOID REQUEST" : "REFUND REQUEST"}
                    </span>

                    <p className="text-2xl font-bold mt-3">
                      UGX {Number(sale.totalAmount || 0).toLocaleString()}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Requested by{" "}
                      <span className="font-semibold">
                        {sale.voidedBy?.name || "Unknown"}
                      </span>{" "}
                      ({sale.voidedBy?.role}) · {sale.store?.name}
                    </p>

                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl p-3">
                      "{sale.voidReason}"
                    </p>

                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      Requested {new Date(sale.requestedAt).toLocaleString()}
                    </div>

                    <div className="mt-4 space-y-1">
                      {sale.saleItems?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm text-slate-600"
                        >
                          <span>
                            {item.product?.name} × {item.quantity}
                          </span>
                          <span>UGX {Number(item.subtotal).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {rejectingId === sale.id ? (
                  <div className="mt-5 border-t pt-4 space-y-3">
                    <textarea
                      className="w-full p-3 border rounded-2xl text-sm"
                      rows={2}
                      placeholder="Reason for rejecting (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(sale.id)}
                        disabled={processingId === sale.id}
                        className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                        className="flex-1 bg-slate-200 py-3 rounded-2xl font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex gap-3 justify-end border-t pt-4">
                    <button
                      onClick={() => setRejectingId(sale.id)}
                      disabled={processingId === sale.id}
                      className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-2 rounded-2xl border border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XIcon size={16} />
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(sale.id)}
                      disabled={processingId === sale.id}
                      className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-2xl hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check size={16} />
                      {processingId === sale.id ? "Processing..." : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}