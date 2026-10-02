import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  Plus,
  Package,
  AlertTriangle,
  Search,
  Filter,
  Hash,
  Barcode,
  Pencil,
  Trash2,
  Layers,
  X,
  Box,
} from "lucide-react";
import toast from "react-hot-toast";
import ManageUnitsSerialsModal from "./products/ManageUnitsSerialsModal";
import useAuthStore from "../../store/useAuthStore";
import { useConfirm } from "../../components/ui/ConfirmProvider";

const UNIT_LABELS = {
  pcs: "Pieces",
  box: "Box",
  roll: "Roll",
  set: "Set",
};

const emptyForm = {
  name: "",
  barcode: "",
  sku: "",
  buyingPrice: "",
  sellingPrice: "",
  stockQuantity: "",
  unitType: "pcs",
  isSerialized: false,
};

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `UGX ${Number(n).toLocaleString()}`;
}

export default function ProductsModule() {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();

  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // list filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL | LOW | IN_STOCK
  const [unitFilter, setUnitFilter] = useState("ALL");

  // selection / modes
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("idle"); // idle | view | create | edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [managingProduct, setManagingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await api.get("/products/low-stock");
      setLowStock(res.data || []);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    if (!user?.activeStoreId && !user?.storeId) return;
    fetchProducts();
    fetchLowStock();
  }, [user?.activeStoreId, user?.storeId]);

  // keep selected in sync after refetch
  useEffect(() => {
    if (!selected) return;
    const fresh = products.find((p) => p.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      if (stockFilter === "LOW" && Number(p.stockQuantity) > 10) return false;
      if (stockFilter === "IN_STOCK" && Number(p.stockQuantity) <= 10) return false;
      if (unitFilter !== "ALL" && p.unitType !== unitFilter) return false;

      if (!q) return true;
      const hay = [p.name, p.sku, p.barcode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [products, search, stockFilter, unitFilter]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setMode("create");
  };

  const openView = (p) => {
    setSelected(p);
    setMode("view");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name || "",
      barcode: selected.barcode || "",
      sku: selected.sku || "",
      buyingPrice: selected.buyingPrice ?? "",
      sellingPrice: selected.sellingPrice ?? "",
      stockQuantity: selected.stockQuantity ?? "",
      unitType: selected.unitType || "pcs",
      isSerialized: !!selected.isSerialized,
    });
    setMode("edit");
  };

  const closePanel = () => {
    setSelected(null);
    setForm(emptyForm);
    setMode("idle");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.sellingPrice === "") {
      toast.error("Name and selling price are required");
      return;
    }
    try {
      setSaving(true);
      const res = await api.post("/products", form);
      toast.success("Product created");
      await fetchProducts();
      await fetchLowStock();
      // open the new product in view mode
      setSelected(res.data);
      setMode("view");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      await api.put(`/products/${selected.id}`, form);
      toast.success("Product updated");
      await fetchProducts();
      await fetchLowStock();
      setMode("view");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: `Delete ${selected.name}?`,
      message:
        "This removes it permanently, including its units and serial numbers if any exist.",
      confirmText: "Delete Product",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.delete(`/products/${selected.id}`);
      toast.success("Product deleted");
      closePanel();
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const isLow = (p) => Number(p?.stockQuantity) <= 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package /> Products
        </h1>
        <button
          onClick={openCreate}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus size={20} /> New Product
        </button>
      </div>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <button
          type="button"
          onClick={() => setStockFilter("LOW")}
          className="w-full text-left bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-3 hover:bg-orange-100/60 transition"
        >
          <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-orange-700">
              Low stock alert — {lowStock.length} item
              {lowStock.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-orange-600/80">
              Click to filter the list to low-stock products
            </p>
          </div>
        </button>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All stock levels</option>
            <option value="LOW">Low stock (≤ 10)</option>
            <option value="IN_STOCK">In stock (&gt; 10)</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All units</option>
            <option value="pcs">Pieces</option>
            <option value="box">Box</option>
            <option value="roll">Roll</option>
            <option value="set">Set</option>
          </select>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — list */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
          <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Products
            </p>
            <span className="text-xs text-slate-400">
              {filtered.length} of {products.length}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y">
            {loading ? (
              <p className="text-center text-slate-500 py-16">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-slate-500 py-16">
                No products match your filters
              </p>
            ) : (
              filtered.map((p) => {
                const active = selected?.id === p.id && mode !== "create";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openView(p)}
                    className={`w-full text-left px-5 py-4 transition flex gap-3 items-start ${
                      active
                        ? "bg-slate-50 border-l-4 border-nova-blue"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold truncate">{p.name}</p>
                        {isLow(p) && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                            Low
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {p.sku ? `SKU ${p.sku}` : p.barcode || "—"}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-sm">
                        <span className="font-semibold text-nova-900">
                          {formatMoney(p.sellingPrice)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            isLow(p) ? "text-orange-600" : "text-slate-500"
                          }`}
                        >
                          {p.stockQuantity} {p.unitType || "pcs"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — detail / form */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm overflow-hidden min-h-[420px]">
          {/* IDLE */}
          {mode === "idle" && (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-slate-400 gap-3 p-8">
              <Package size={40} className="opacity-40" />
              <p className="text-sm">Select a product or create a new one</p>
            </div>
          )}

          {/* VIEW — product facts + actions */}
          {mode === "view" && selected && (
            <div className="flex flex-col h-full">
              {/* Header strip */}
              <div className="p-6 border-b flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Package size={28} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-nova-900 truncate">
                    {selected.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selected.sku && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Hash size={11} /> {selected.sku}
                      </span>
                    )}
                    {selected.barcode && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Barcode size={11} /> {selected.barcode}
                      </span>
                    )}
                    {isLow(selected) && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        Low stock
                      </span>
                    )}
                    {selected.hasUnits && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-nova-blue">
                        Has units
                      </span>
                    )}
                    {selected.isSerialized && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        Serialized
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Facts */}
              <div className="p-6 grid sm:grid-cols-2 gap-6 flex-1">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Pricing
                  </h3>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Selling price</dt>
                      <dd className="font-semibold">
                        {formatMoney(selected.sellingPrice)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Buying price</dt>
                      <dd className="font-medium">
                        {formatMoney(selected.buyingPrice)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Margin</dt>
                      <dd className="font-medium">
                        {selected.sellingPrice != null &&
                        selected.buyingPrice != null
                          ? formatMoney(
                              Number(selected.sellingPrice) -
                                Number(selected.buyingPrice)
                            )
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Inventory
                  </h3>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Stock on hand</dt>
                      <dd
                        className={`font-semibold ${
                          isLow(selected) ? "text-orange-600" : ""
                        }`}
                      >
                        {selected.stockQuantity}{" "}
                        {UNIT_LABELS[selected.unitType] ||
                          selected.unitType ||
                          "pcs"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Unit type</dt>
                      <dd className="font-medium">
                        {UNIT_LABELS[selected.unitType] ||
                          selected.unitType ||
                          "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Serialized</dt>
                      <dd className="font-medium">
                        {selected.isSerialized ? "Yes" : "No"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t bg-slate-50/80 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openEdit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-nova-900 text-white hover:bg-nova-800 text-sm font-medium"
                >
                  <Pencil size={15} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setManagingProduct(selected)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-white hover:bg-slate-50 text-sm font-medium"
                >
                  <Layers size={15} /> Units & Serials
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-sm font-medium ml-auto"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          )}

          {/* CREATE / EDIT form */}
          {(mode === "create" || mode === "edit") && (
            <form
              onSubmit={mode === "create" ? handleCreate : handleUpdate}
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Box size={22} />
                  {mode === "create" ? "New product" : "Edit product"}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    mode === "edit" && selected ? setMode("view") : closePanel()
                  }
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className="p-3 border rounded-2xl sm:col-span-2"
                  placeholder="Product name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  className="p-3 border rounded-2xl"
                  placeholder="Barcode"
                  value={form.barcode}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                />
                <input
                  className="p-3 border rounded-2xl"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                <select
                  className="p-3 border rounded-2xl"
                  value={form.unitType}
                  onChange={(e) =>
                    setForm({ ...form, unitType: e.target.value })
                  }
                >
                  <option value="pcs">Pieces</option>
                  <option value="box">Box</option>
                  <option value="roll">Roll</option>
                  <option value="set">Set</option>
                </select>
                <label className="flex items-center gap-3 p-3 border rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isSerialized}
                    onChange={(e) =>
                      setForm({ ...form, isSerialized: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-nova-blue"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Track serial numbers
                  </span>
                </label>
                <input
                  type="number"
                  className="p-3 border rounded-2xl"
                  placeholder="Buying price"
                  value={form.buyingPrice}
                  onChange={(e) =>
                    setForm({ ...form, buyingPrice: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="p-3 border rounded-2xl"
                  placeholder="Selling price *"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  className="p-3 border rounded-2xl sm:col-span-2"
                  placeholder="Stock quantity"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : mode === "create"
                      ? "Create product"
                      : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    mode === "edit" && selected ? setMode("view") : closePanel()
                  }
                  className="px-6 py-3 rounded-2xl border"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Units & Serials modal */}
      {managingProduct && (
        <ManageUnitsSerialsModal
          product={managingProduct}
          onClose={() => setManagingProduct(null)}
          onChanged={() => {
            fetchProducts();
            fetchLowStock();
          }}
        />
      )}
    </div>
  );
}