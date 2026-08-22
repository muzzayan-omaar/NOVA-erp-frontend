import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Truck,
  Plus,
  DollarSign,
  Send,
  PackageCheck,
  Ban,
  Mail,
} from "lucide-react";
import NewPurchaseOrderModal from "./NewPurchaseOrderModal";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-600",
  RECEIVED: "bg-green-100 text-green-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [receivingOrderId, setReceivingOrderId] = useState(null);
  const [receiveQuantities, setReceiveQuantities] = useState({});
  const [receivingExtraCost, setReceivingExtraCost] = useState("");
  const [receivingExtraCostNotes, setReceivingExtraCostNotes] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [detailRes, ordersRes] = await Promise.all([
        api.get(`/suppliers/${id}/detail`),
        api.get("/purchase-orders", { params: { supplierId: id } }),
      ]);
      setData(detailRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const handleSend = async (orderId) => {
    try {
      const res = await api.post(`/purchase-orders/${orderId}/send`);
      if (res.data.email?.sent) {
        toast.success("Order emailed to supplier");
      } else {
        toast.success("Order marked as sent — email not configured, share it manually");
      }
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send order");
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    try {
      await api.post(`/purchase-orders/cancel/${orderId}`);
      toast.success("Order cancelled");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    }
  };

  const startReceiving = (order) => {
  setReceivingOrderId(order.id);
  setReceivingExtraCost("");
  setReceivingExtraCostNotes("");
  const defaults = {};
  order.items.forEach((i) => {
    defaults[i.id] = i.quantityOrdered;
  });
  setReceiveQuantities(defaults);
};

  const confirmReceive = async (orderId) => {
  try {
    const items = Object.entries(receiveQuantities).map(([itemId, quantityReceived]) => ({
      itemId,
      quantityReceived: Number(quantityReceived),
    }));
    await api.post(`/purchase-orders/${orderId}/receive`, {
      items,
      additionalCosts: Number(receivingExtraCost) || 0,
      additionalCostsNotes: receivingExtraCostNotes,
    });
    toast.success("Stock received, cost updated");
    setReceivingOrderId(null);
    fetchAll();
  } catch (err) {
    toast.error(err?.response?.data?.message || "Failed to receive order");
  }
};

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      setSubmittingPayment(true);
      await api.post(`/suppliers/${id}/pay`, { amount: Number(paymentAmount), notes: paymentNotes });
      toast.success("Payment recorded");
      setShowPayment(false);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!data) return <p className="text-center py-20">Supplier not found</p>;

  const { supplier, payments, analytics } = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin/suppliers")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Suppliers
      </button>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Truck /> {supplier.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {supplier.phone || "—"} · {supplier.email || "No email on file"}
            </p>
            <p className="text-slate-400 text-xs mt-1">{supplier.address}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPayment(true)}
              className="bg-green-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold"
            >
              <DollarSign size={18} /> Record Payment
            </button>
            <button
              onClick={() => setShowNewOrder(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold"
            >
              <Plus size={18} /> New Order
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
          <p className="text-xs text-slate-500">Total Spent</p>
          <p className="text-2xl font-bold">UGX {analytics.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            UGX {analytics.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Orders</p>
          <p className="text-2xl font-bold">{analytics.orderCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow p-5">
          <p className="text-xs text-slate-500">Last Order</p>
          <p className="text-lg font-bold">
            {analytics.lastOrderDate ? new Date(analytics.lastOrderDate).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">Purchase Orders</h2>

        {orders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
                      {o.status}
                    </span>
                    <p className="text-sm text-slate-500 mt-2">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)
                    </p>
                  </div>
                  <p className="text-lg font-bold">UGX {o.total.toLocaleString()}</p>
                </div>

                <div className="mt-3 space-y-1">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm text-slate-600">
                      <span>{i.product?.name} × {i.quantityOrdered}</span>
                      <span>UGX {(i.quantityOrdered * i.unitCost).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {receivingOrderId === o.id ? (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <p className="text-sm font-semibold">Confirm quantities received</p>
                    {o.items.map((i) => (
                      <div key={i.id} className="flex items-center gap-3">
                        <span className="text-sm flex-1">{i.product?.name}</span>
                        <input
                          type="number"
                          className="w-24 p-2 border rounded-lg text-sm"
                          value={receiveQuantities[i.id] ?? i.quantityOrdered}
                          onChange={(e) =>
                            setReceiveQuantities({ ...receiveQuantities, [i.id]: e.target.value })
                          }
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
  <div>
    <label className="text-xs text-slate-500">Freight / Transport Cost (optional)</label>
    <input
      type="number"
      className="w-full p-2 border rounded-lg text-sm mt-1"
      placeholder="e.g. transport fee"
      value={receivingExtraCost}
      onChange={(e) => setReceivingExtraCost(e.target.value)}
    />
  </div>
  <div>
    <label className="text-xs text-slate-500">Note</label>
    <input
      className="w-full p-2 border rounded-lg text-sm mt-1"
      placeholder="e.g. truck hire to Mukono branch"
      value={receivingExtraCostNotes}
      onChange={(e) => setReceivingExtraCostNotes(e.target.value)}
    />
  </div>
</div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => confirmReceive(o.id)}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold"
                      >
                        Confirm Received
                      </button>
                      <button
                        onClick={() => setReceivingOrderId(null)}
                        className="flex-1 bg-slate-200 py-3 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 mt-4 border-t pt-4">
                    {o.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => handleSend(o.id)}
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50"
                        >
                          <Send size={14} /> {supplier.email ? "Email Order" : "Mark as Sent"}
                        </button>
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50"
                        >
                          <Ban size={14} /> Cancel
                        </button>
                      </>
                    )}
                    {o.status === "SENT" && (
                      <button
                        onClick={() => startReceiving(o)}
                        className="flex items-center gap-2 text-sm font-medium text-green-600 px-4 py-2 rounded-xl border border-green-200 hover:bg-green-50"
                      >
                        <PackageCheck size={14} /> Receive Order
                      </button>
                    )}
                  </div>
                )}
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
                <span>{p.description}</span>
                <span className="font-semibold">UGX {Number(p.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewOrder && (
        <NewPurchaseOrderModal
          supplierId={id}
          onClose={() => setShowNewOrder(false)}
          onSuccess={fetchAll}
        />
      )}

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