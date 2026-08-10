import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";

const statusStyles = {
  PENDING_VERIFICATION: { icon: Clock, className: "bg-amber-100 text-amber-600" },
  VERIFIED: { icon: CheckCircle2, className: "bg-green-100 text-green-600" },
  REJECTED: { icon: XCircle, className: "bg-red-100 text-red-600" },
};

export default function BillingModule() {
  const [status, setStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    plan: "",
    amount: "",
    method: "MOBILE_MONEY",
    referenceNumber: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statusRes, paymentsRes, plansRes] = await Promise.all([
        api.get("/subscription/status"),
        api.get("/subscription/payments"),
        api.get("/plans"),
      ]);
      setStatus(statusRes.data);
      setPayments(paymentsRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load billing info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Set default selected plan once plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !form.plan) {
      setForm((f) => ({ ...f, plan: plans[0].code }));
    }
  }, [plans]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.referenceNumber) {
      toast.error("Amount and reference number are required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/subscription/payments", {
        amount: parseFloat(form.amount),
        method: form.method,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
        // plan: form.plan,  // uncomment if backend expects the selected plan
      });

      toast.success("Payment submitted for verification");
      setShowForm(false);
      setForm({
        plan: plans[0]?.code || "",
        amount: "",
        method: "MOBILE_MONEY",
        referenceNumber: "",
        notes: "",
      });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center py-20">Loading...</p>;
  }

  const sub = status?.subscription;
  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <CreditCard /> Billing & Subscription
      </h1>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-500">Current Plan</p>
            <p className="text-2xl font-bold">{sub?.plan || "—"}</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                status?.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {sub?.status || "NO SUBSCRIPTION"}
            </span>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">
              {sub?.status === "TRIALING" ? "Trial ends in" : "Renews in / Expires in"}
            </p>
            <p className="text-2xl font-bold">{daysLeft} day(s)</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Renew / Upgrade Plan"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 bg-slate-50 p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, plan: p.code })}
                  className={`p-4 rounded-2xl border text-center transition ${
                    form.plan === p.code ? "border-blue-600 bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    UGX {Number(p.price).toLocaleString()} / {p.durationDays} days
                  </p>
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Payment Method</label>
              <select
                className="w-full p-3 border rounded-2xl mt-1"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Amount Paid (UGX)</label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-2xl mt-1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Transaction Reference</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-2xl mt-1"
                  placeholder="e.g. MM240912.1234"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
              <textarea
                className="w-full p-3 border rounded-2xl mt-1"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Payment"}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-4">Payment History</h2>

        {payments.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No payments submitted yet</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const style = statusStyles[p.status] || statusStyles.PENDING_VERIFICATION;
              const Icon = style.icon;
              return (
                <div key={p.id} className="flex justify-between items-center border rounded-2xl p-4">
                  <div>
                    <p className="font-medium">
                      UGX {Number(p.amount).toLocaleString()} — {p.method.replace("_", " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ref: {p.referenceNumber} · {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${style.className}`}
                  >
                    <Icon size={14} />
                    {p.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}