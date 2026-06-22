import { useEffect, useState } from "react";
import api from "../../services/api";
import { TrendingUp, ShoppingCart, AlertTriangle, Users, DollarSign, BarChart3 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from "react-hot-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardModule() {
  const [data, setData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [basicRes, advancedRes] = await Promise.all([
        api.get("/analytics"),
        api.get("/analytics/advanced?period=30") // 30 days for better trends
      ]);
      
      setData(basicRes.data);
      setAdvancedData(advancedRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const exportToExcel = () => {
    const exportData = [
      ["Date", "Revenue", "Transactions"],
      ...(advancedData?.salesTrend || []).map(item => [item.date, item.revenue, item.count])
    ];
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Trend");
    XLSX.writeFile(wb, `Nova_Sales_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Excel report downloaded");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Nova ERP - Sales Report", 14, 20);
    doc.autoTable({
      head: [['Date', 'Revenue (UGX)', 'Transactions']],
      body: (advancedData?.salesTrend || []).map(item => [
        item.date, item.revenue.toLocaleString(), item.count
      ]),
    });
    doc.save(`Nova_Sales_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("PDF report downloaded");
  };

  if (loading || !data) {
    return <div className="h-full flex items-center justify-center text-slate-500">Loading business intelligence...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold">Owner Intelligence</h1>
          <p className="text-slate-500">Real-time performance & insights</p>
        </div>

        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
            📊 Export Excel
          </button>
          <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
            📕 Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow">
          <DollarSign className="text-green-600 mb-4" size={40} />
          <p className="text-slate-500">Total Revenue</p>
          <p className="text-4xl font-bold mt-2">UGX {data.totalRevenue?.toLocaleString() || "0"}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow">
          <ShoppingCart className="text-blue-600 mb-4" size={40} />
          <p className="text-slate-500">Transactions</p>
          <p className="text-4xl font-bold mt-2">{data.totalTransactions || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow">
          <AlertTriangle className="text-orange-600 mb-4" size={40} />
          <p className="text-slate-500">Low Stock</p>
          <p className="text-4xl font-bold mt-2 text-orange-600">{data.lowStock?.length || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow">
          <Users className="text-purple-600 mb-4" size={40} />
          <p className="text-slate-500">Active Cashiers</p>
          <p className="text-4xl font-bold mt-2">{advancedData?.cashierPerformance?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend - Last 30 Days */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 /> Sales Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={advancedData?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-xl font-bold mb-6">Top Cashiers</h2>
          <div className="space-y-4">
            {advancedData?.cashierPerformance?.slice(0, 5).map((cashier, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {cashier.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{cashier.name}</p>
                    <p className="text-xs text-slate-500">{cashier.transactionCount} transactions</p>
                  </div>
                </div>
                <p className="font-bold text-lg">UGX {cashier.totalSales.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.lowStock?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-orange-700 mb-4">Low Stock Items - Action Required</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.lowStock.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-orange-100">
                <p className="font-medium">{p.name}</p>
                <p className="text-red-600 font-bold text-2xl mt-1">{p.stockQuantity}</p>
                <p className="text-xs text-slate-500">remaining</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}