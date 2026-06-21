import { useEffect, useState } from "react";
import api from "../../services/api";
import { ArrowUpDown, Package, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function InventoryModule() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: "",
    quantity: "",
    type: "IN", // IN or OUT
    reason: ""
  });

  const fetchData = async () => {
    try {
      const [movRes, prodRes] = await Promise.all([
        api.get("/inventory/movements"),
        api.get("/products")
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustment = async () => {
    if (!adjustmentForm.productId || !adjustmentForm.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await api.post("/inventory/adjust", adjustmentForm);
      toast.success("Stock adjusted successfully");
      setAdjustmentForm({ productId: "", quantity: "", type: "IN", reason: "" });
      fetchData();
    } catch (err) {
      toast.error("Adjustment failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Package /> Inventory Management
      </h1>

      {/* Stock Adjustment Form */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-6">Stock Adjustment</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            className="p-4 border rounded-2xl"
            value={adjustmentForm.productId}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
            ))}
          </select>

          <select
            className="p-4 border rounded-2xl"
            value={adjustmentForm.type}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
          >
            <option value="IN">Stock In (+)</option>
            <option value="OUT">Stock Out (-)</option>
          </select>

          <input
            type="number"
            placeholder="Quantity"
            className="p-4 border rounded-2xl"
            value={adjustmentForm.quantity}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
          />

          <input
            placeholder="Reason (Optional)"
            className="p-4 border rounded-2xl"
            value={adjustmentForm.reason}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
          />
        </div>

        <button
          onClick={handleAdjustment}
          className="mt-6 bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700"
        >
          Apply Adjustment
        </button>
      </div>

      {/* Movement History */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <ArrowUpDown /> Recent Inventory Movements
        </h2>

        <div className="space-y-3 max-h-[500px] overflow-auto">
          {movements.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No movements yet</p>
          ) : (
            movements.map(m => (
              <div key={m.id} className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${m.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="font-medium">{m.product?.name}</p>
                    <p className="text-sm text-slate-500">{m.reason || "No reason provided"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-lg ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'IN' ? '+' : ''}{m.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}