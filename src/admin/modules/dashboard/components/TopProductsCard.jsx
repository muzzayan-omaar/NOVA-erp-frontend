import { Trophy } from "lucide-react";

export default function TopProductsCard({ products = [] }) {
  const maxRevenue = Math.max(...products.map((p) => p.revenue || 0), 1);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
        <Trophy size={20} /> Top Products
      </h2>

      {products.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No sales in this period yet</p>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  {i + 1}. {p.name}
                </span>
                <span className="text-slate-500">
                  {p.quantity} sold · UGX {p.revenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}