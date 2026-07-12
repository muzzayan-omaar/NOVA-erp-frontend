import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  ShoppingCart,
  Package,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

export default function ReportsModule() {
    const { user } = useAuthStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await api.get("/reports/dashboard");

      setReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (user?.activeStoreId || user?.storeId) {
    fetchReport();
  }
}, [user?.activeStoreId, user?.storeId]);

  const Card = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-3xl shadow p-6">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
      >
        <Icon className="text-white" size={30} />
      </div>

      <p className="text-slate-500 mt-5">{title}</p>

      <h2 className="text-3xl font-bold mt-2">
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </h2>
    </div>
  );

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Reports Dashboard
        </h1>

        <p className="text-slate-500">
          Live business summary for the selected store
        </p>
      </div>

      {/* SALES */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Sales
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Card
            title="Today's Sales"
            value={`UGX ${report.sales.today.toLocaleString()}`}
            icon={ShoppingCart}
            color="bg-green-600"
          />

          <Card
            title="This Month"
            value={`UGX ${report.sales.month.toLocaleString()}`}
            icon={DollarSign}
            color="bg-blue-600"
          />

          <Card
            title="Transactions"
            value={report.sales.transactions}
            icon={ShoppingCart}
            color="bg-slate-800"
          />
        </div>
      </div>

      {/* INVENTORY */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Inventory
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Card
            title="Products"
            value={report.inventory.products}
            icon={Package}
            color="bg-indigo-600"
          />

          <Card
            title="Stock Value"
            value={`UGX ${report.inventory.stockValue.toLocaleString()}`}
            icon={Package}
            color="bg-cyan-600"
          />

          <Card
            title="Low Stock"
            value={report.inventory.lowStock}
            icon={Package}
            color="bg-red-600"
          />
        </div>
      </div>

      {/* CUSTOMERS */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Customers
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            title="Total Customers"
            value={report.customers.count}
            icon={Users}
            color="bg-purple-600"
          />

          <Card
            title="Outstanding Credit"
            value={`UGX ${report.customers.credit.toLocaleString()}`}
            icon={Users}
            color="bg-orange-600"
          />
        </div>
      </div>

      {/* SUPPLIERS */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Suppliers
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            title="Suppliers"
            value={report.suppliers.count}
            icon={Truck}
            color="bg-blue-700"
          />

          <Card
            title="Amount Owed"
            value={`UGX ${report.suppliers.owed.toLocaleString()}`}
            icon={Truck}
            color="bg-red-700"
          />
        </div>
      </div>

      {/* PAYROLL */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Payroll
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            title="Payroll Records"
            value={report.payroll.employees}
            icon={DollarSign}
            color="bg-emerald-700"
          />

          <Card
            title="Payroll Cost"
            value={`UGX ${report.payroll.cost.toLocaleString()}`}
            icon={DollarSign}
            color="bg-teal-700"
          />
        </div>
      </div>

      {/* PAYMENTS */}

      <div>
        <h2 className="text-xl font-bold mb-4">
          Payment Methods
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Card
            title="Cash"
            value={`UGX ${report.payments.cash.toLocaleString()}`}
            icon={CreditCard}
            color="bg-green-700"
          />

          <Card
            title="Mobile Money"
            value={`UGX ${report.payments.mobile.toLocaleString()}`}
            icon={CreditCard}
            color="bg-blue-700"
          />

          <Card
            title="Card"
            value={`UGX ${report.payments.card.toLocaleString()}`}
            icon={CreditCard}
            color="bg-purple-700"
          />
        </div>
      </div>

    </div>
  );
}