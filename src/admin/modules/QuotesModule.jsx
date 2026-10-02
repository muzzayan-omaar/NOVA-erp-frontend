import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  X,
  Trash2,
  Search,
  Filter,
  User,
  Calendar,
} from "lucide-react";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-nova-blue",
  CONVERTED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
};

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `UGX ${Number(n).toLocaleString()}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function QuotesModule() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
      setQuotes(quotesRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
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
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const addRow = () => setItems((prev) => [...prev, { productId: "", quantity: "" }]);
  const removeRow = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const previewTotal = items.reduce((sum, i) => {
    const product = products.find((p) => p.id === i.productId);
    if (!product || !i.quantity) return sum;
    return sum + Number(product.sellingPrice) * Number(i.quantity);
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
        notes: notes || null,
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return quotes.filter((quote) => {
      if (statusFilter !== "ALL" && quote.status !== statusFilter) return false;

      if (!q) return true;
      const hay = [
        quote.customer?.name,
        quote.user?.name,
        quote.notes,
        quote.status,
        quote.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [quotes, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { ALL: quotes.length };
    for (const q of quotes) {
      c[q.status] = (c[q.status] || 0) + 1;
    }
    return c;
  }, [quotes]);

  const totalValue = quotes
    .filter((q) => q.status !== "CANCELLED" && q.status !== "EXPIRED")
    .reduce((s, q) => s + Number(q.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText /> Quotations
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          {showForm ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <Plus size={20} /> New Quote
            </>
          )}
        </button>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Total quotes</p>
          <p className="font-semibold mt-1 text-lg">{quotes.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Draft</p>
          <p className="font-semibold mt-1 text-lg">{counts.DRAFT || 0}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Converted</p>
          <p className="font-semibold mt-1 text-lg text-emerald-700">
            {counts.CONVERTED || 0}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Open value</p>
          <p className="font-semibold mt-1 text-lg">{formatMoney(totalValue)}</p>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={createQuote}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <h2 className="font-bold text-lg">New quotation</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              className="p-3 border rounded-2xl"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">No customer (walk-in quote)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="p-3 border rounded-2xl"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              title="Valid until"
            />
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Line items
            </p>
            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              const lineTotal =
                product && item.quantity
                  ? Number(product.sellingPrice) * Number(item.quantity)
                  : null;

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <select
                    className="col-span-12 sm:col-span-6 p-3 border rounded-xl text-sm"
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, "productId", e.target.value)
                    }
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatMoney(p.sellingPrice)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qty"
                    className="col-span-4 sm:col-span-2 p-3 border rounded-xl text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />
                  <div className="col-span-6 sm:col-span-3 text-sm text-slate-500 font-medium tabular-nums">
                    {lineTotal != null ? formatMoney(lineTotal) : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="col-span-2 sm:col-span-1 p-2 rounded-xl text-red-500 hover:bg-red-50 flex justify-center"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-nova-blue font-medium hover:underline"
            >
              <Plus size={16} /> Add line item
            </button>
          </div>

          <textarea
            placeholder="Notes (optional)"
            className="w-full p-3 border rounded-2xl resize-none h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-4">
            <div className="text-sm text-slate-500">
              Subtotal {formatMoney(previewTotal)} · VAT (18%){" "}
              {formatMoney(previewVat)}
            </div>
            <p className="text-xl font-bold text-nova-900">
              {formatMoney(previewTotal + previewVat)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create quote"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-3 rounded-2xl border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, creator, notes…"
            className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All statuses ({counts.ALL || 0})</option>
            <option value="DRAFT">Draft ({counts.DRAFT || 0})</option>
            <option value="SENT">Sent ({counts.SENT || 0})</option>
            <option value="CONVERTED">
              Converted ({counts.CONVERTED || 0})
            </option>
            <option value="EXPIRED">Expired ({counts.EXPIRED || 0})</option>
            <option value="CANCELLED">
              Cancelled ({counts.CANCELLED || 0})
            </option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          No quotes match your filters
        </p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 text-xs font-semibold text-slate-400 border-b bg-slate-50">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created by</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Items</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y">
            {filtered.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => navigate(`/admin/quotes/${q.id}`)}
                className="w-full text-left px-6 py-4 hover:bg-slate-50 transition grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
              >
                <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {q.customer?.name || "Walk-in"}
                    </p>
                    {q.validUntil && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> Valid until{" "}
                        {formatDate(q.validUntil)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      STATUS_STYLES[q.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="md:col-span-2 text-sm text-slate-600 flex items-center gap-1.5 truncate">
                  <User size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{q.user?.name || "—"}</span>
                </div>

                <div className="md:col-span-2 text-sm text-slate-500">
                  {formatDate(q.createdAt)}
                </div>

                <div className="md:col-span-1 text-sm text-slate-500">
                  {q.items?.length ?? 0}
                </div>

                <div className="md:col-span-2 text-right font-semibold tabular-nums">
                  {formatMoney(q.totalAmount)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}