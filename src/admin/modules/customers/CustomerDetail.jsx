
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Phone, DollarSign, Trash2 } from "lucide-react";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}/detail`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      setSubmittingPayment(true);
      await api.post(`/customers/${id}/pay`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes,
      });
      toast.success("Payment recorded");
      setShowPayment(false);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await api.delete(`/customers/${id}`);
      toast.success("Customer deleted");
      navigate("/admin/customers");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!data) return <p className="text-center py-20">Customer not found</p>;

  const { customer, creditSales, payments, analytics } = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin/customers")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Customers
      </button>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Phone /> {customer.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {customer.phone || "—"} · {customer.email || "No email"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPayment(true)}
              className="bg-green-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold"
            >
              <DollarSign size={18} /> Record Payment
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold border border-red-200"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Currently Owed</p>
          <p className="text-2xl font-bold text-red-600">
            UGX {Number(analytics.currentlyOwed).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Credit Issued</p>
          <p className="text-2xl font-bold">UGX {analytics.totalCreditIssued.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            UGX {analytics.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Credit Sales</p>
          <p className="text-2xl font-bold">{analytics.creditSaleCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Last Sale</p>
          <p className="text-lg font-bold">
            {analytics.lastSaleDate ? new Date(analytics.lastSaleDate).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">Credit Sales</h2>
        {creditSales.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No credit sales yet</p>
        ) : (
          <div className="space-y-3">
            {creditSales.map((s) => (
              <div key={s.id} className="border rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      s.status === "COMPLETED"
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s.status}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(s.createdAt).toLocaleDateString()} · {s.saleItems.length} item(s)
                  </p>
                </div>
                <p className="font-bold">UGX {Number(s.totalAmount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b py-3">
                <span>
                  {p.method.replace("_", " ")} {p.notes ? `— ${p.notes}` : ""}
                </span>
                <span className="font-semibold text-green-600">
                  + UGX {Number(p.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <DollarSign /> Record Payment
            </h2>
            <p className="text-sm text-slate-500">
              Currently owed: UGX {Number(analytics.currentlyOwed).toLocaleString()}
            </p>
            <form onSubmit={handlePayment} className="space-y-4">
              <input
                type="number"
                placeholder="Amount paid"
                className="w-full p-4 border rounded-2xl"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <select
                className="w-full p-4 border rounded-2xl"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Card</option>
              </select>
              <input
                placeholder="Notes (optional)"
                className="w-full p-4 border rounded-2xl"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
                >
                  {submittingPayment ? "Saving..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="flex-1 bg-slate-200 py-4 rounded-2xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}