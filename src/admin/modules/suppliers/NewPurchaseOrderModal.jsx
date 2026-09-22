import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { X, Plus, Trash2 } from "lucide-react";

export default function NewPurchaseOrderModal({ supplierId, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [unitsByProduct, setUnitsByProduct] = useState({}); // { [productId]: ProductUnit[] }
  const [items, setItems] = useState([
    { productId: "", productUnitId: "", quantityOrdered: "", unitCost: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data)).catch(() => {});
  }, []);

  const fetchUnitsFor = async (productId) => {
    if (!productId || unitsByProduct[productId]) return;
    try {
      const res = await api.get(`/products/${productId}/units`);
      setUnitsByProduct((prev) => ({ ...prev, [productId]: res.data.filter((u) => u.isActive) }));
    } catch {
      setUnitsByProduct((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    if (field === "productId") {
      fetchUnitsFor(value);
      setItems((prev) => prev.map((item, i) => (i === index ? { ...item, productUnitId: "" } : item)));
    }
  };

  const addRow = () => setItems([...items, { productId: "", productUnitId: "", quantityOrdered: "", unitCost: "" }]);
  const removeRow = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, i) => sum + (Number(i.quantityOrdered) || 0) * (Number(i.unitCost) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter((i) => i.productId && i.quantityOrdered && i.unitCost);
    if (validItems.length === 0) {
      toast.error("Add at least one complete line item");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/purchase-orders", {
        supplierId,
        notes,
        items: validItems.map((i) => ({
          productId: i.productId,
          productUnitId: i.productUnitId || null,
          quantityOrdered: i.quantityOrdered,
          unitCost: i.unitCost,
        })),
      });
      toast.success("Purchase order created");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">New Purchase Order</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              const units = unitsByProduct[item.productId] || [];

              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="col-span-4 p-3 border rounded-xl text-sm"
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    className="col-span-3 p-3 border rounded-xl text-sm"
                    value={item.productUnitId}
                    onChange={(e) => updateItem(index, "productUnitId", e.target.value)}
                    disabled={!item.productId}
                  >
                    <option value="">{product?.unitType || "Base unit"}</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitName} ({u.conversionFactor} × {product?.unitType || "base"})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Qty"
                    className="col-span-2 p-3 border rounded-xl text-sm"
                    value={item.quantityOrdered}
                    onChange={(e) => updateItem(index, "quantityOrdered", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Cost per unit"
                    className="col-span-2 p-3 border rounded-xl text-sm"
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="col-span-1 text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-blue-600 font-medium"
          >
            <Plus size={16} /> Add line item
          </button>

          <textarea
            placeholder="Notes for supplier (optional)"
            className="w-full p-4 border rounded-2xl"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-slate-500">Order Total</p>
            <p className="text-xl font-bold">UGX {total.toLocaleString()}</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Draft Order"}
          </button>
        </form>
      </div>
    </div>
  );
}