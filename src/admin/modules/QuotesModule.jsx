import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FileText, Plus, X, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-600",
  CONVERTED: "bg-green-100 text-green-600",
  EXPIRED: "bg-amber-100 text-amber-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function QuotesModule() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: "" }]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [quotesRes, customersRes, productsRes] = await Promise.all([
        api.get("/quotes"),
        api.get("/customers"),
        api.get("/products"),
      ]);
      setQuotes(quotesRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addRow = () => setItems([...items, { productId: "", quantity: "" }]);
  const removeRow = (index) => setItems(items.filter((_, i) => i !== index));

  const previewTotal = items.reduce((sum, i) => {
    const product = products.find((p) => p.id === i.productId);
    if (!product || !i.quantity) return sum;
    return sum + product.sellingPrice * Number(i.quantity);
  }, 0);
  const previewVat = previewTotal * 0.18;

  const resetForm = () => {
    setCustomerId("");
    setNotes("");
    setValidUntil("");
    setItems([{ productId: "", quantity: "" }]);
  };

  const createQuote = async (e) => {
    e.preventDefault();

    const validItems = items.filter((i) => i.productId && i.quantity);
    if (validItems.length === 0) {
      toast.error("Add at least one complete line item");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/quotes", {
        customerId: customerId || null,
        items: validItems,
        notes,
        validUntil: validUntil || null,
      });
      toast.success("Quote created");
      resetForm();
      setShowForm(false);
      navigate(`/admin/quotes/${res.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText /> Quotations
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "New Quote"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createQuote} className="bg-white rounded-3xl shadow p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              className="p-4 border rounded-2xl"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">No customer (walk-in quote)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="p-4 border rounded-2xl"
              placeholder="Valid until"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="col-span-6 p-3 border rounded-xl text-sm"
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — UGX {p.sellingPrice.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="col-span-3 p-3 border rounded-xl text-sm"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                  <div className="col-span-2 text-sm text-slate-500">
                    {product && item.quantity
                      ? `UGX ${(product.sellingPrice * Number(item.quantity)).toLocaleString()}`
                      : "—"}
                  </div>
                  <button type="button" onClick={() => removeRow(index)} className="col-span-1 text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
            <Plus size={16} /> Add line item
          </button>

          <textarea
            placeholder="Notes (optional)"
            className="w-full p-4 border rounded-2xl"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-between items-center border-t pt-4 text-sm text-slate-500">
            <span>Subtotal: UGX {previewTotal.toLocaleString()} + VAT UGX {previewVat.toLocaleString()}</span>
            <span className="text-xl font-bold text-slate-900">
              UGX {(previewTotal + previewVat).toLocaleString()}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Quote"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-6">
        {loading ? (
          <p className="text-center text-slate-500 py-10">Loading...</p>
        ) : quotes.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No quotes yet</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                onClick={() => navigate(`/admin/quotes/${q.id}`)}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[q.status]}`}>
                      {q.status}
                    </span>
                    <p className="font-semibold">{q.customer?.name || "Walk-in"}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    By {q.user?.name} · {new Date(q.createdAt).toLocaleDateString()} · {q.items.length} item(s)
                  </p>
                </div>
                <p className="font-bold text-lg">UGX {Number(q.totalAmount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}