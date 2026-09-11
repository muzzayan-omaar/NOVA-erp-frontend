import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FileText,
  Send,
  Ban,
  CheckCircle2,
  Plus,
  Trash2,
  UserCircle,
} from "lucide-react";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-600",
  CONVERTED: "bg-green-100 text-green-600",
  EXPIRED: "bg-amber-100 text-amber-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "CARD", "CREDIT"];

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [showConvert, setShowConvert] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [singleMethod, setSingleMethod] = useState("CASH");
  const [splitLines, setSplitLines] = useState([]);
  const [splitDraft, setSplitDraft] = useState({ method: "CASH", amount: "", reference: "" });
  const [creditCustomerId, setCreditCustomerId] = useState("");
  const [converting, setConverting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [quoteRes, productsRes, customersRes] = await Promise.all([
        api.get(`/quotes/${id}`),
        api.get("/products"),
        api.get("/customers"),
      ]);
      setQuote(quoteRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------- Editing items ---------- */

  const startEditing = () => {
    setEditItems(quote.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    setEditing(true);
  };

  const updateEditItem = (index, field, value) => {
    setEditItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addEditRow = () => setEditItems([...editItems, { productId: "", quantity: "" }]);
  const removeEditRow = (index) => setEditItems(editItems.filter((_, i) => i !== index));

  const saveEdits = async () => {
    const validItems = editItems.filter((i) => i.productId && i.quantity);
    if (validItems.length === 0) {
      toast.error("Add at least one complete line item");
      return;
    }
    try {
      setSavingEdit(true);
      await api.patch(`/quotes/${id}`, { items: validItems });
      toast.success("Quote updated");
      setEditing(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update quote");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ---------- Send / Cancel ---------- */

  const handleSend = async () => {
    try {
      const res = await api.post(`/quotes/${id}/send`);
      toast.success(res.data.email?.sent ? "Quote emailed to customer" : "Marked as sent — email not configured, share manually");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send quote");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this quote?")) return;
    try {
      await api.post(`/quotes/${id}/cancel`);
      toast.success("Quote cancelled");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel quote");
    }
  };

  /* ---------- Convert to Sale ---------- */

  const splitAssigned = splitLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const splitRemaining = quote ? quote.totalAmount - splitAssigned : 0;
  const splitHasCredit = splitLines.some((l) => l.method === "CREDIT");

  const addSplitLine = () => {
    const amt = Number(splitDraft.amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > splitRemaining + 0.01) {
      toast.error("That's more than what's left to cover");
      return;
    }
    setSplitLines([...splitLines, { ...splitDraft, amount: amt }]);
    setSplitDraft({ method: "CASH", amount: "", reference: "" });
  };

  const removeSplitLine = (index) => setSplitLines(splitLines.filter((_, i) => i !== index));

  const needsCreditCustomer = () => {
    const hasCredit = splitMode ? splitHasCredit : singleMethod === "CREDIT";
    return hasCredit && !quote.customerId && !creditCustomerId;
  };

  const handleConvert = async () => {
    if (splitMode) {
      if (splitLines.length === 0) {
        toast.error("Add at least one payment line");
        return;
      }
      if (Math.abs(splitRemaining) > 1) {
        toast.error(`Payment lines don't add up (UGX ${splitRemaining.toLocaleString()} remaining)`);
        return;
      }
    }

    if (needsCreditCustomer()) {
      toast.error("Select a customer for the credit portion first");
      return;
    }

    try {
      setConverting(true);

      // Attach a customer to the quote first if one was picked just for the credit portion
      if (creditCustomerId && !quote.customerId) {
        await api.patch(`/quotes/${id}`, { customerId: creditCustomerId });
      }

      const payload = splitMode
        ? { payments: splitLines.map((l) => ({ method: l.method, amount: Number(l.amount), reference: l.reference || undefined })) }
        : { paymentMethod: singleMethod };

      await api.post(`/quotes/${id}/convert`, payload);
      toast.success("Converted to a real sale — stock updated");
      fetchAll();
      setShowConvert(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to convert quote");
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!quote) return <p className="text-center py-20">Quote not found</p>;

  const canAct = !["CONVERTED", "CANCELLED"].includes(quote.status);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/admin/quotes")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Quotes
      </button>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FileText /> Quote for {quote.customer?.name || "Walk-in customer"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              By {quote.user?.name} · {new Date(quote.createdAt).toLocaleString()}
              {quote.validUntil ? ` · Valid until ${new Date(quote.validUntil).toLocaleDateString()}` : ""}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_STYLES[quote.status]}`}>
            {quote.status}
          </span>
        </div>

        {quote.notes && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-4">{quote.notes}</p>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Items</h2>
          {canAct && !editing && (
            <button onClick={startEditing} className="text-sm text-blue-600 font-medium underline">
              Edit Items
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-2">
            {quote.items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm border-b py-3">
                <span>{i.product?.name} × {i.quantity}</span>
                <span className="font-medium">UGX {i.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-3 text-slate-500">
              <span>Subtotal</span><span>UGX {quote.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>VAT (18%)</span><span>UGX {quote.vatAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span><span>UGX {quote.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {editItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select
                  className="col-span-7 p-3 border rounded-xl text-sm"
                  value={item.productId}
                  onChange={(e) => updateEditItem(index, "productId", e.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — UGX {p.sellingPrice.toLocaleString()}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  className="col-span-3 p-3 border rounded-xl text-sm"
                  value={item.quantity}
                  onChange={(e) => updateEditItem(index, "quantity", e.target.value)}
                />
                <button onClick={() => removeEditRow(index)} className="col-span-1 text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button onClick={addEditRow} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
              <Plus size={16} /> Add line item
            </button>
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={saveEdits}
                disabled={savingEdit}
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-slate-200 py-3 rounded-2xl font-semibold">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {canAct && !editing && (
        <div className="bg-white rounded-3xl shadow p-8 space-y-4">
          <h2 className="text-lg font-bold">Actions</h2>

          <div className="flex gap-3">
            {quote.status === "DRAFT" && (
              <button
                onClick={handleSend}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 px-4 py-3 rounded-2xl border border-blue-200 hover:bg-blue-50"
              >
                <Send size={16} /> {quote.customer?.email ? "Email Quote" : "Mark as Sent"}
              </button>
            )}
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-3 rounded-2xl border border-red-200 hover:bg-red-50"
            >
              <Ban size={16} /> Cancel Quote
            </button>
            <button
              onClick={() => setShowConvert(!showConvert)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-2xl font-semibold"
            >
              <CheckCircle2 size={18} /> Convert to Sale
            </button>
          </div>

          {showConvert && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSplitMode(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${!splitMode ? "bg-slate-900 text-white" : "bg-slate-200"}`}
                >
                  Single Payment
                </button>
                <button
                  onClick={() => setSplitMode(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${splitMode ? "bg-slate-900 text-white" : "bg-slate-200"}`}
                >
                  Split Payment
                </button>
              </div>

              {!splitMode ? (
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSingleMethod(m)}
                      className={`py-3 rounded-xl text-sm font-medium ${singleMethod === m ? "bg-blue-600 text-white" : "bg-slate-100"}`}
                    >
                      {m === "MOBILE_MONEY" ? "Mobile Money" : m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {splitLines.map((l, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border rounded-xl p-3 text-sm">
                      <span>{l.method === "MOBILE_MONEY" ? "Mobile Money" : l.method}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">UGX {Number(l.amount).toLocaleString()}</span>
                        <button onClick={() => removeSplitLine(i)} className="text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <select
                      className="p-3 border rounded-xl text-sm flex-1"
                      value={splitDraft.method}
                      onChange={(e) => setSplitDraft({ ...splitDraft, method: e.target.value })}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m === "MOBILE_MONEY" ? "Mobile Money" : m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      className="p-3 border rounded-xl text-sm w-28"
                      value={splitDraft.amount}
                      onChange={(e) => setSplitDraft({ ...splitDraft, amount: e.target.value })}
                    />
                    <button onClick={addSplitLine} className="bg-slate-900 text-white px-3 rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className={`text-sm font-medium ${Math.abs(splitRemaining) < 1 ? "text-green-600" : "text-amber-600"}`}>
                    Remaining to assign: UGX {splitRemaining.toLocaleString()}
                  </div>
                </div>
              )}

              {((splitMode && splitHasCredit) || (!splitMode && singleMethod === "CREDIT")) && !quote.customerId && (
                <div>
                  <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                    <UserCircle size={16} /> Customer required for the credit portion
                  </label>
                  <select
                    className="w-full p-3 border rounded-2xl"
                    value={creditCustomerId}
                    onChange={(e) => setCreditCustomerId(e.target.value)}
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={converting}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
              >
                {converting ? "Converting..." : `Confirm & Complete Sale — UGX ${quote.totalAmount.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      )}

      {quote.status === "CONVERTED" && (
        <div className="bg-green-50 rounded-3xl p-6 text-center text-green-700 font-medium">
          This quote has been converted into a real sale.
        </div>
      )}
    </div>
  );
}