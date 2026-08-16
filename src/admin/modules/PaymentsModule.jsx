import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  CreditCard,
  Banknote,
  Wallet,
  TrendingUp,
  RefreshCcw,
  Receipt,
  Search,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import ReceiptModal from "../../components/pos/ReceiptModal";

const METHOD_STYLES = {
  CASH: "bg-green-100 text-green-600",
  MOBILE_MONEY: "bg-blue-100 text-blue-600",
  CARD: "bg-purple-100 text-purple-600",
  CREDIT: "bg-amber-100 text-amber-600",
  MIXED: "bg-slate-200 text-slate-600",
};

export default function PaymentsModule() {
  const { user } = useAuthStore();

  const [paymentData, setPaymentData] = useState({
    cash: 0, mobile: 0, card: 0, credit: 0, mixed: 0, total: 0, transactionCount: 0,
  });
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [receiptSale, setReceiptSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchAll = async () => {
    try {
      const params = {};
      if (methodFilter !== "All") params.method = methodFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (search) params.search = search;

      const [summaryRes, txnRes] = await Promise.all([
        api.get("/payments/summary"),
        api.get("/payments/transactions", { params }),
      ]);

      setPaymentData(summaryRes.data);
      setTransactions(txnRes.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.activeStoreId || user?.storeId) {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.activeStoreId, user?.storeId, methodFilter, dateFrom, dateTo]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAll();
  };

  const viewReceipt = async (saleId) => {
    try {
      const res = await api.get(`/payments/transactions/${saleId}`);
      const sale = res.data;

      setReceiptSale({
        ...sale,
        items: sale.saleItems.map((i) => ({
          name: i.product?.name || "Unknown item",
          qty: i.quantity,
          sellingPrice: i.unitPrice,
        })),
      });
      setShowReceipt(true);
    } catch (err) {
      toast.error("Failed to load receipt");
    }
  };

  const Card = ({ title, amount, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow hover:shadow-lg transition">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">
        {typeof amount === "number" && title !== "Transactions"
          ? `UGX ${amount.toLocaleString()}`
          : amount}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-slate-500">Today's totals and full transaction history</p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-700"
        >
          <RefreshCcw size={18} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Cash" amount={paymentData.cash || 0} icon={Banknote} color="bg-green-600" />
        <Card title="Mobile Money" amount={paymentData.mobile || 0} icon={Wallet} color="bg-blue-600" />
        <Card title="Card" amount={paymentData.card || 0} icon={CreditCard} color="bg-purple-600" />
        <Card title="Credit" amount={paymentData.credit || 0} icon={Receipt} color="bg-amber-600" />
        <Card title="Total Today" amount={paymentData.total || 0} icon={TrendingUp} color="bg-slate-900" />
        <Card title="Transactions" amount={paymentData.transactionCount || 0} icon={Receipt} color="bg-orange-600" />
      </div>

      <div className="bg-white rounded-3xl shadow p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-4 top-4 text-slate-400" size={18} />
            <input
              className="w-full p-4 pl-12 rounded-2xl border"
              placeholder="Search cashier, customer, or receipt ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="p-4 border rounded-2xl"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="All">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
            <option value="MIXED">Mixed</option>
          </select>

          <input
            type="date"
            className="p-4 border rounded-2xl"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="p-4 border rounded-2xl"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <button type="submit" className="bg-blue-600 text-white px-6 rounded-2xl font-semibold">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-6">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center border rounded-2xl p-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${METHOD_STYLES[t.paymentMethod] || "bg-slate-100 text-slate-600"}`}>
                      {t.paymentMethod.replace("_", " ")}
                    </span>
                    <p className="text-sm text-slate-500">
                      {t.user?.name || "Unknown cashier"}
                      {t.customer ? ` · ${t.customer.name}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(t.createdAt).toLocaleString()} · {t.saleItems.length} item(s)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg">UGX {Number(t.totalAmount).toLocaleString()}</p>
                  <button
                    onClick={() => viewReceipt(t.id)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50"
                  >
                    <Eye size={16} /> Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={receiptSale}
        onVoided={fetchAll}
      />
    </div>
  );
}