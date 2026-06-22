import { useEffect, useState } from "react";
import api from "../../services/api";
import { CreditCard, Banknote, Wallet, TrendingUp } from "lucide-react";

export default function PaymentsModule() {
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    mobile: 0,
    card: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchPaymentSummary = async () => {
    try {
      const res = await api.get("/payments/summary");
      setPaymentData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSummary();
  }, []);

  const Card = ({ title, amount, icon: Icon, color }) => (
    <div className="bg-white p-8 rounded-3xl shadow flex flex-col">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon className="text-white" size={32} />
      </div>
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-4xl font-bold mt-2">UGX {amount.toLocaleString()}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payments Overview</h1>
        <p className="text-slate-500">Financial breakdown by payment method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Cash Payments" 
          amount={paymentData.cash || 0} 
          icon={Banknote} 
          color="bg-green-600" 
        />
        <Card 
          title="Mobile Money" 
          amount={paymentData.mobile || 0} 
          icon={Wallet} 
          color="bg-blue-600" 
        />
        <Card 
          title="Card Payments" 
          amount={paymentData.card || 0} 
          icon={CreditCard} 
          color="bg-purple-600" 
        />
        <Card 
          title="Total Revenue" 
          amount={paymentData.total || 0} 
          icon={TrendingUp} 
          color="bg-slate-800" 
        />
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-xl font-bold mb-4">Recent Payment Trends</h2>
        <p className="text-slate-500">More detailed analytics coming in Phase 5 (Owner Dashboard)</p>
      </div>
    </div>
  );
}