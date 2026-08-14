import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  Package,
  ArrowUpDown,
  Search,
  Plus,
  X,
  ArrowRightLeft,
  ArrowDown,
  ArrowUp,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import TransferStockModal from "./inventory/TransferStockModal";

const TYPE_STYLES = {
  IN: { label: "Stock In", className: "bg-green-100 text-green-600" },
  OUT: { label: "Stock Out", className: "bg-red-100 text-red-600" },
  SALE: { label: "Sale", className: "bg-blue-100 text-blue-600" },
  ADJUSTMENT: { label: "Adjustment", className: "bg-amber-100 text-amber-600" },
  TRANSFER_OUT: { label: "Transfer Out", className: "bg-purple-100 text-purple-600" },
  TRANSFER_IN: { label: "Transfer In", className: "bg-teal-100 text-teal-600" },
};

export default function InventoryModule() {
  const { user } = useAuthStore();

  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [adjustment, setAdjustment] = useState({
    productId: "",
    quantity: "",
    type: "IN",
    reason: "",
  });

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inventoryValue: 0,
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filterType !== "All") params.type = filterType;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const [movementRes, productRes] = await Promise.all([
        api.get("/inventory/movements", { params }),
        api.get("/products"),
      ]);

      setMovements(movementRes.data);
      setProducts(productRes.data);

      const totalStock = productRes.data.reduce(
        (sum, p) => sum + (p.stockQuantity || 0),
        0
      );

      const lowStock = productRes.data.filter(
        (p) => (p.stockQuantity || 0) <= 10
      );

      const outStock = productRes.data.filter(
        (p) => (p.stockQuantity || 0) === 0
      );

      const value = productRes.data.reduce(
        (sum, p) => sum + (p.stockQuantity || 0) * (p.buyingPrice || 0),
        0
      );

      setStats({
        totalProducts: productRes.data.length,
        totalStock,
        lowStockCount: lowStock.length,
        outOfStockCount: outStock.length,
        inventoryValue: value,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.activeStoreId || user?.storeId) {
      fetchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.activeStoreId, user?.storeId, filterType, dateFrom, dateTo]);

  const adjustStock = async () => {
    try {
      if (!adjustment.productId || !adjustment.quantity) {
        toast.error("Product and quantity required");
        return;
      }

      await api.post("/inventory/adjust", adjustment);

      toast.success("Stock updated");

      setShowAdjust(false);

      setAdjustment({
        productId: "",
        quantity: "",
        type: "IN",
        reason: "",
      });

      fetchInventory();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Stock adjustment failed");
    }
  };

  const filteredMovements = movements.filter((m) => {
    const name = m.product?.name?.toLowerCase() || "";
    return name.includes(searchTerm.toLowerCase());
  });

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package />
          Inventory Management
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTransfer(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex gap-2 items-center"
          >
            <ArrowRightLeft size={20} />
            Transfer Stock
          </button>

          <button
            onClick={() => setShowAdjust(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex gap-2 items-center"
          >
            <Plus size={20} />
            Adjust Stock
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <Stat title="Products" value={stats.totalProducts} />
        <Stat title="Stock Units" value={stats.totalStock} />
        <Stat title="Low Stock" value={stats.lowStockCount} />
        <Stat title="Out Stock" value={stats.outOfStockCount} />
        <Stat title="Value" value={`UGX ${stats.inventoryValue.toLocaleString()}`} />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl shadow p-5 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-4 text-slate-400" />
            <input
              className="w-full p-4 pl-12 rounded-2xl border"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="p-4 border rounded-2xl"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="SALE">Sales</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="TRANSFER_IN">Transfer In</option>
          </select>
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              className="w-full p-3 border rounded-xl mt-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              className="w-full p-3 border rounded-xl mt-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo || filterType !== "All") && (
            <button
              onClick={() => {
                clearDateFilters();
                setFilterType("All");
              }}
              className="flex items-center gap-1 text-sm text-slate-500 mt-5"
            >
              <RefreshCw size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* MOVEMENTS */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold flex gap-3 mb-6">
          <ArrowUpDown />
          Movement History
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : filteredMovements.length === 0 ? (
          <p className="text-center text-slate-500">No movements found</p>
        ) : (
          filteredMovements.map((m) => {
            const style = TYPE_STYLES[m.type] || { label: m.type, className: "bg-slate-100 text-slate-600" };
            const isPositive = ["IN", "TRANSFER_IN"].includes(m.type) || (m.type === "ADJUSTMENT" && false);
            const isTransfer = m.type === "TRANSFER_OUT" || m.type === "TRANSFER_IN";

            return (
              <div
                key={m.id}
                className="flex justify-between items-start border rounded-2xl p-5 mb-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.className}`}>
                      {style.label}
                    </span>
                    <p className="font-bold">{m.product?.name}</p>
                  </div>

                  <p className="text-sm text-slate-500 mt-1">{m.reason || "No reason given"}</p>

                  {isTransfer && (m.sourceStore || m.targetStore) && (
                    <p className="text-xs text-slate-400 mt-1">
                      {m.type === "TRANSFER_OUT"
                        ? `→ sent to ${m.targetStore?.name || "another store"}`
                        : `← received from ${m.sourceStore?.name || "another store"}`}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 mt-1">
                    by {m.createdBy?.name || "Unknown"}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`font-bold flex items-center gap-1 justify-end ${
                    m.type === "OUT" || m.type === "SALE" || m.type === "TRANSFER_OUT"
                      ? "text-red-600"
                      : m.type === "ADJUSTMENT"
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}>
                    {m.type === "OUT" || m.type === "SALE" || m.type === "TRANSFER_OUT" ? (
                      <ArrowDown size={16} />
                    ) : m.type !== "ADJUSTMENT" ? (
                      <ArrowUp size={16} />
                    ) : null}
                    {m.type === "ADJUSTMENT" ? "→ " : m.type === "OUT" || m.type === "SALE" || m.type === "TRANSFER_OUT" ? "-" : "+"}
                    {m.quantity}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADJUST MODAL */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-5">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Adjust Stock</h2>
              <button onClick={() => setShowAdjust(false)}>
                <X />
              </button>
            </div>

            <select
              className="w-full p-4 border rounded-xl"
              value={adjustment.productId}
              onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              className="w-full p-4 border rounded-xl"
              type="number"
              placeholder="Quantity"
              value={adjustment.quantity}
              onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
            />

            <select
              className="w-full p-4 border rounded-xl"
              value={adjustment.type}
              onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
            >
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Set Quantity</option>
            </select>

            <input
              className="w-full p-4 border rounded-xl"
              placeholder="Reason"
              value={adjustment.reason}
              onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
            />

            <button
              onClick={adjustStock}
              className="w-full bg-blue-600 text-white py-4 rounded-xl"
            >
              Save Adjustment
            </button>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransfer && (
        <TransferStockModal
          products={products}
          onClose={() => setShowTransfer(false)}
          onSuccess={fetchInventory}
        />
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}