import { useEffect, useState } from "react";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import useAuthStore from "../../store/useAuthStore";

export default function ProductsModule() {

  const { user } = useAuthStore();

  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [mode, setMode] = useState("list"); // list, create, edit
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    sku: "",
    buyingPrice: "",
    sellingPrice: "",
    stockQuantity: "",
    unitType: "pcs"
  });

  const fetchProducts = async () => {
    const res = await api.get("/products");
    setProducts(res.data);
  };

  const fetchLowStock = async () => {
    const res = await api.get("/products/low-stock");
    setLowStock(res.data);
  };

  useEffect(() => {
  if (!user?.activeStoreId && !user?.storeId) return;

  fetchProducts();
  fetchLowStock();

}, [
  user?.activeStoreId,
  user?.storeId
]);

  const resetForm = () => {
    setForm({
      name: "", barcode: "", sku: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", unitType: "pcs"
    });
  };

  const createProduct = async () => {
    try {
      await api.post("/products", form);
      toast.success("Product created successfully");
      resetForm();
      setMode("list");
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      toast.error("Failed to create product");
    }
  };

  const updateProduct = async () => {
    try {
      await api.put(`/products/${selectedProduct.id}`, form);
      toast.success("Product updated");
      setMode("list");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <button
          onClick={() => { setMode("create"); resetForm(); }}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> New Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            <AlertTriangle /> Low Stock Alert ({lowStock.length} items)
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Products List */}
        <div className="col-span-5 bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-lg mb-4">All Products</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {products.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
                  setForm(p);
                  setMode("edit");
                }}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-500">SKU: {p.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">UGX {p.sellingPrice.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Stock: {p.stockQuantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Panel */}
        <div className="col-span-7 bg-white rounded-3xl shadow p-8">
          {mode === "list" && (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a product or click "New Product"
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Package /> {mode === "create" ? "New Product" : "Edit Product"}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Product Name" className="p-4 border rounded-2xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="Barcode" className="p-4 border rounded-2xl" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="SKU" className="p-4 border rounded-2xl" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                <select className="p-4 border rounded-2xl" value={form.unitType} onChange={e => setForm({...form, unitType: e.target.value})}>
                  <option value="pcs">Pieces</option>
                  <option value="box">Box</option>
                  <option value="roll">Roll</option>
                  <option value="set">Set</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input type="number" placeholder="Buying Price" className="p-4 border rounded-2xl" value={form.buyingPrice} onChange={e => setForm({...form, buyingPrice: e.target.value})} />
                <input type="number" placeholder="Selling Price" className="p-4 border rounded-2xl" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} />
                <input type="number" placeholder="Stock Quantity" className="p-4 border rounded-2xl" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={mode === "create" ? createProduct : updateProduct}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold"
                >
                  {mode === "create" ? "Create Product" : "Save Changes"}
                </button>

                {mode === "edit" && (
                  <button
                    onClick={() => deleteProduct(selectedProduct.id)}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold"
                  >
                    Delete Product
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}