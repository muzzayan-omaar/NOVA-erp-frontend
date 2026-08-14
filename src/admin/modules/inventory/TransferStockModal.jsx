import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { X, ArrowRightLeft } from "lucide-react";

export default function TransferStockModal({ products, onClose, onSuccess }) {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    targetStoreId: "",
    mode: "CLONE",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    api
      .get("/stores/options")
      .then((res) => setStores(res.data))
      .catch(() => toast.error("Failed to load store list"))
      .finally(() => setLoadingStores(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.productId || !form.targetStoreId) {
      toast.error("Select a product and destination store");
      return;
    }
    if (form.mode === "CLONE" && (!form.quantity || Number(form.quantity) <= 0)) {
      toast.error("Enter a quantity to transfer");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/inventory/transfer", {
        productId: form.productId,
        targetStoreId: form.targetStoreId,
        mode: form.mode,
        quantity: form.mode === "CLONE" ? Number(form.quantity) : undefined,
        reason: form.reason,
      });

      toast.success(
        form.mode === "RELOCATE" ? "Product relocated" : "Stock transferred"
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft size={20} /> Transfer Stock
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Product</label>
            <select
              className="w-full p-4 border rounded-xl mt-1"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.stockQuantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Destination store</label>
            <select
              className="w-full p-4 border rounded-xl mt-1"
              value={form.targetStoreId}
              onChange={(e) => setForm({ ...form, targetStoreId: e.target.value })}
              disabled={loadingStores}
            >
              <option value="">
                {loadingStores ? "Loading stores..." : "Select store"}
              </option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.isHeadOffice ? " (Head Office)" : ""}
                </option>
              ))}
            </select>
            {stores.length === 0 && !loadingStores && (
              <p className="text-xs text-slate-400 mt-1">
                No other stores yet — nothing to transfer to.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Transfer type</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: "CLONE" })}
                className={`p-3 rounded-xl border text-sm text-left ${
                  form.mode === "CLONE" ? "border-blue-600 bg-blue-50" : "border-slate-200"
                }`}
              >
                <p className="font-semibold">Send some, keep some</p>
                <p className="text-xs text-slate-500 mt-1">Both branches stock it independently</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: "RELOCATE" })}
                className={`p-3 rounded-xl border text-sm text-left ${
                  form.mode === "RELOCATE" ? "border-blue-600 bg-blue-50" : "border-slate-200"
                }`}
              >
                <p className="font-semibold">Move it all</p>
                <p className="text-xs text-slate-500 mt-1">Entire product hands over to that branch</p>
              </button>
            </div>
          </div>

          {form.mode === "CLONE" && (
            <div>
              <label className="text-sm font-medium text-slate-700">Quantity to send</label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl mt-1"
                placeholder={selectedProduct ? `Max ${selectedProduct.stockQuantity}` : "Quantity"}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          )}

          {form.mode === "RELOCATE" && selectedProduct && (
            <div className="bg-amber-50 text-amber-700 text-sm rounded-xl p-3">
              This moves all {selectedProduct.stockQuantity} units — the product will
              no longer appear in this store's inventory afterward.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
            <input
              className="w-full p-4 border rounded-xl mt-1"
              placeholder="e.g. Branch 2 running low"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Transferring..." : "Confirm Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}