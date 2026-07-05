import { useEffect, useState } from "react";
import api from "../../services/api";
import { Package, AlertTriangle, ArrowUpDown, Plus, Search, Download, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function InventoryModule() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPeriod, setFilterPeriod] = useState("All");

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    todaysMovements: 0,
    inventoryValue: 0
  });

  const fetchData = async () => {
    try {
      const [movRes, prodRes] = await Promise.all([
        api.get("/inventory/movements"),
        api.get("/products")
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);

      // Calculate stats
      const totalStock = prodRes.data.reduce((sum, p) => sum + p.stockQuantity, 0);
      const lowStockItems = prodRes.data.filter(p => p.stockQuantity <= 10);
      const outOfStock = prodRes.data.filter(p => p.stockQuantity === 0);
      const inventoryValue = prodRes.data.reduce((sum, p) => sum + (p.stockQuantity * p.buyingPrice), 0);

      setStats({
        totalProducts: prodRes.data.length,
        totalStock,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStock.length,
        todaysMovements: movRes.data.length, // Simplified
        inventoryValue
      });

      setLowStock(lowStockItems);
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

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Package /> Inventory Management Center
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow">
          <p className="text-slate-500 text-sm">Total Products</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow">
          <p className="text-slate-500 text-sm">Total Stock</p>
          <p className="text-3xl font-bold">{stats.totalStock}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow text-orange-600">
          <p className="text-slate-500 text-sm">Low Stock Items</p>
          <p className="text-3xl font-bold">{stats.lowStockCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow text-red-600">
          <p className="text-slate-500 text-sm">Out of Stock</p>
          <p className="text-3xl font-bold">{stats.outOfStockCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow">
          <p className="text-slate-500 text-sm">Today's Movements</p>
          <p className="text-3xl font-bold">{stats.todaysMovements}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow">
          <p className="text-slate-500 text-sm">Inventory Value</p>
          <p className="text-3xl font-bold">UGX {stats.inventoryValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search product, barcode, SKU..."
            className="w-full pl-12 p-4 border rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="p-4 border rounded-2xl" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="All">All Movements</option>
          <option value="SALE">Sales</option>
          <option value="PURCHASE">Purchases</option>
          <option value="ADJUSTMENT">Adjustments</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>

        <select className="p-4 border rounded-2xl" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
          <option value="All">All Time</option>
          <option value="Today">Today</option>
          <option value="Week">This Week</option>
          <option value="Month">This Month</option>
        </select>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl">
          <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
            <AlertTriangle /> Low Stock Items
          </h3>
          <div className="flex flex-wrap gap-3">
            {lowStock.slice(0, 8).map(p => (
              <div key={p.id} className="bg-white px-5 py-3 rounded-2xl border border-orange-100">
                {p.name} <span className="font-bold text-red-600">({p.stockQuantity})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement History */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <ArrowUpDown /> Inventory Movements
        </h2>

        <div className="space-y-4 max-h-[600px] overflow-auto">
          {filteredMovements.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No movements found</p>
          ) : (
            filteredMovements.map(m => (
              <div key={m.id} className="flex justify-between items-center p-5 border rounded-2xl hover:bg-slate-50">
                <div className="flex items-center gap-5">
                  <div className={`px-5 py-2 rounded-2xl text-xs font-medium ${m.type === 'IN' || m.type === 'PURCHASE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {m.type}
                  </div>
                  <div>
                    <p className="font-medium">{m.product?.name}</p>
                    <p className="text-xs text-slate-500">{m.reason}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-xl ${m.type.includes('IN') || m.type === 'PURCHASE' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type.includes('IN') || m.type === 'PURCHASE' ? '+' : ''}{m.quantity}
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

      {/* Stock Adjustment */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-6">Stock Adjustment</h2>
        {/* Keep your existing adjustment form here */}
      </div>
    </div>
  );
}