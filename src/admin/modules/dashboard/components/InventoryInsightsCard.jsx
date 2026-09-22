import { PackageSearch, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";

export default function InventoryInsightsCard({ inventory }) {
  if (!inventory) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
        <PackageSearch size={20} /> Inventory Insights
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">Inventory Value</p>
          <p className="text-xl font-bold">UGX {inventory.inventoryValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">Turnover Rate</p>
          <p className="text-xl font-bold">{inventory.inventoryTurnover.toFixed(2)}×</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div>
          <ArrowDownCircle className="mx-auto text-green-600 mb-1" size={18} />
          <p className="text-sm font-semibold">{inventory.stockIn}</p>
          <p className="text-xs text-slate-400">Stock In</p>
        </div>
        <div>
          <ArrowUpCircle className="mx-auto text-red-600 mb-1" size={18} />
          <p className="text-sm font-semibold">{inventory.stockOut}</p>
          <p className="text-xs text-slate-400">Stock Out</p>
        </div>
        <div>
          <SlidersHorizontal className="mx-auto text-amber-600 mb-1" size={18} />
          <p className="text-sm font-semibold">{inventory.adjustments}</p>
          <p className="text-xs text-slate-400">Adjustments</p>
        </div>
      </div>

      {inventory.deadStock?.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            {inventory.deadStock.length} product(s) haven't sold in 30 days
          </p>
          <div className="space-y-1">
            {inventory.deadStock.slice(0, 5).map((p) => (
              <p key={p.id} className="text-xs text-amber-700">
                {p.name} — {p.stockQuantity} in stock
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}