import { useState, useEffect } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SubscriptionExpiredScreen({ status, onRenewed }) {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    plan: "",
    amount: "",
    method: "MOBILE_MONEY",
    referenceNumber: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .get("/plans")
      .then((res) => {
        setPlans(res.data);
        if (res.data.length > 0) {
          setForm((f) => ({ ...f, plan: res.data[0].code }));
        }
      })
      .catch((err) => console.error("Failed to load plans", err));
  }, []);

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

      setSubmitted(true);
      toast.success("Payment submitted for verification");
      onRenewed();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8">
        {submitted ? (
          <div className="text-center py-10">
            <CheckCircle2 className="mx-auto text-green-600 mb-4" size={56} />
            <h1 className="text-2xl font-bold mb-2">Payment Submitted</h1>
            <p className="text-slate-500">
              Your payment reference has been received and is awaiting
              verification. Your subscription will activate as soon as it's
              confirmed — usually within a few hours.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <ShieldAlert className="mx-auto text-red-500 mb-3" size={48} />
              <h1 className="text-2xl font-bold">
                {status?.reason === "EXPIRED" &&
                status?.subscription?.plan === "TRIAL"
                  ? "Your free trial has ended"
                  : "Your subscription has expired"}
              </h1>
              <p className="text-slate-500 mt-2">
                Renew below to keep using Nova ERP. Your data is safe and
                nothing has been deleted.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, plan: p.code })}
                  className={`p-4 rounded-2xl border text-center transition ${
                    form.plan === p.code
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    UGX {Number(p.price).toLocaleString()} / {p.durationDays} days
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Payment Method
                </label>
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
                  <label className="text-sm font-medium text-slate-700">
                    Amount Paid (UGX)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border rounded-2xl mt-1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-2xl mt-1"
                    placeholder="e.g. MM240912.1234"
                    value={form.referenceNumber}
                    onChange={(e) =>
                      setForm({ ...form, referenceNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Notes (optional)
                </label>
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
          </>
        )}
      </div>
    </div>
  );
}