import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { Check, X as XIcon, Inbox } from "lucide-react";

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState({});
  const [selectedCycle, setSelectedCycle] = useState({});
  const [rejectingId, setRejectingId] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [paymentsRes, pkgRes, cycleRes] = await Promise.all([
        platformApi.get("/platform/payments/pending"),
        platformApi.get("/platform/packages"),
        platformApi.get("/platform/billing-cycles"),
      ]);
      setPayments(paymentsRes.data);
      setPackages(pkgRes.data.filter((p) => p.isActive));
      setCycles(cycleRes.data.filter((c) => c.isActive));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await platformApi.post(`/platform/payments/${id}/verify`, {
        approve: true,
        packageCode: selectedPackage[id] || "STARTER",
        billingCycleCode: selectedCycle[id] || "MONTHLY",
      });
      toast.success("Payment verified — subscription activated");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to verify payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      await platformApi.post(`/platform/payments/${id}/verify`, { approve: false });
      toast.success("Payment rejected");
      setRejectingId(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Pending Payment Verifications</h2>

      {loading ? (
        <p className="text-center py-16">Loading...</p>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl shadow p-16 text-center text-slate-500">
          <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
          All caught up — no pending payments.
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold">{p.company?.name}</p>
                  <p className="text-sm text-slate-500">
                    Submitted by {p.submittedBy?.name} ({p.submittedBy?.email})
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  UGX {Number(p.amount).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-slate-500">Method</p>
                  <p className="font-medium">{p.method.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-slate-500">Reference</p>
                  <p className="font-medium font-mono">{p.referenceNumber}</p>
                </div>
              </div>

              {p.notes && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-3">
                  {p.notes}
                </p>
              )}

              <p className="text-xs text-slate-400 mt-3">
                Submitted {new Date(p.createdAt).toLocaleString()}
              </p>

              {rejectingId === p.id ? (
                <div className="flex gap-3 mt-4 border-t pt-4">
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={processingId === p.id}
                    className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setRejectingId(null)}
                    className="flex-1 bg-slate-200 py-3 rounded-2xl font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 mt-4 border-t pt-4 items-center">
                  <select
                    className="p-3 border rounded-2xl text-sm"
                    value={selectedPackage[p.id] || "STARTER"}
                    onChange={(e) =>
                      setSelectedPackage({
                        ...selectedPackage,
                        [p.id]: e.target.value,
                      })
                    }
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.code} value={pkg.code}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="p-3 border rounded-2xl text-sm"
                    value={selectedCycle[p.id] || "MONTHLY"}
                    onChange={(e) =>
                      setSelectedCycle({
                        ...selectedCycle,
                        [p.id]: e.target.value,
                      })
                    }
                  >
                    {cycles.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setRejectingId(p.id)}
                    disabled={processingId === p.id}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-3 rounded-2xl border border-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XIcon size={16} /> Reject
                  </button>

                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={processingId === p.id}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-3 rounded-2xl hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check size={16} />
                    {processingId === p.id
                      ? "Processing..."
                      : "Approve & Activate"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}