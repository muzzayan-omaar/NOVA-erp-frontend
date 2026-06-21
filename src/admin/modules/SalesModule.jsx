import { useEffect, useState } from "react";
import api from "../../services/api";
import { Receipt, Calendar, User, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function SalesModule() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSales = async () => {
    try {
      const res = await api.get("/sales");
      setSales(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt /> Sales & Receipts
          </h1>
          <p className="text-slate-500">Total Revenue: <span className="font-bold text-green-600">UGX {totalRevenue.toLocaleString()}</span></p>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt ID or cashier..."
            className="w-full pl-12 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <div className="p-6 border-b flex justify-between bg-slate-50">
          <h2 className="font-semibold">Recent Transactions</h2>
          <button onClick={fetchSales} className="text-blue-600 text-sm hover:underline">Refresh</button>
        </div>

        <div className="divide-y max-h-[650px] overflow-auto">
          {loading ? (
            <p className="p-10 text-center text-slate-500">Loading sales...</p>
          ) : filteredSales.length === 0 ? (
            <p className="p-10 text-center text-slate-500">No sales found</p>
          ) : (
            filteredSales.map(sale => (
              <div key={sale.id} className="p-6 hover:bg-slate-50 transition flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
                    <Receipt size={28} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">UGX {sale.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <User size={14} /> {sale.user?.name} • {new Date(sale.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-sm capitalize">
                    {sale.paymentMethod.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">{sale.saleItems?.length || 0} items</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}