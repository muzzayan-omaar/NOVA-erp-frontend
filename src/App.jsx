import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import POS from "./pages/POS";
import Login from "./pages/Login";

import AdminLayout from "./pages/admin/AdminLayout";

/* MODULES */
import DashboardModule from "./admin/modules/DashboardModule";
import ProductsModule from "./admin/modules/ProductsModule";
import InventoryModule from "./admin/modules/InventoryModule";
import SalesModule from "./admin/modules/SalesModule";
import PaymentsModule from "./admin/modules/PaymentsModule";
import UsersModule from "./admin/modules/UsersModule";
import CustomersModule from "./admin/modules/CustomersModule";
import ExpensesModule from "./admin/modules/ExpensesModule";
import SuppliersModule from "./admin/modules/SuppliersModule";
import PayrollModule from "./admin/modules/PayrollModule";

import AuthGate from "./guards/AuthGate";
import useAuthStore from "./store/useAuthStore";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

   return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* POS */}
      <Route
        path="/"
        element={
          <AuthGate>
            <POS />
          </AuthGate>
        }
      />

      {/* Admin Area */}
      <Route
        path="/admin"
        element={
          <AuthGate>
            <AdminLayout />
          </AuthGate>
        }
      >
        <Route index element={<DashboardModule />} />
        <Route path="products" element={<ProductsModule />} />
        <Route path="inventory" element={<InventoryModule />} />
        <Route path="sales" element={<SalesModule />} />
        <Route path="payments" element={<PaymentsModule />} />
        <Route path="users" element={<UsersModule />} />
        <Route path="customers" element={<CustomersModule />}/>
        <Route path="expenses" element={<ExpensesModule />}/>
        <Route path="suppliers" element={<SuppliersModule />}/>
        <Route path="payroll" element={<PayrollModule />}/>
      </Route>
    </Routes>
  );
}
