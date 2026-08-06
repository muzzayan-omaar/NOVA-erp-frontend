import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import POS from "./pages/POS";
import Login from "./pages/Login";

import AdminLayout from "./pages/admin/AdminLayout";

/* MODULES */
import DashboardModule from "./admin/modules/dashboard/DashboardModule";
import ProductsModule from "./admin/modules/ProductsModule";
import InventoryModule from "./admin/modules/InventoryModule";
import SalesModule from "./admin/modules/SalesModule";
import PaymentsModule from "./admin/modules/PaymentsModule";
import UsersModule from "./admin/modules/UsersModule";
import CustomersModule from "./admin/modules/CustomersModule";
import ExpensesModule from "./admin/modules/ExpensesModule";
import SuppliersModule from "./admin/modules/SuppliersModule";
import PayrollModule from "./admin/modules/PayrollModule";
import StoresModule from "./admin/modules/StoresModule";
import ReportsModule from "./admin/modules/ReportsModule";

import AuthGate from "./guards/AuthGate";
import useAuthStore from "./store/useAuthStore";
import ProtectedRoute from "./guards/ProtectedRoute";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(()=>{

    const restoreSession=async()=>{

        useAuthStore.getState().hydrate();

        try{

            const res =
            await api.get("/auth/me");

            useAuthStore.getState().setAuth(

                res.data,

                useAuthStore.getState().token

            );

        }

        catch{

            useAuthStore.getState().logout();

        }

    };

    restoreSession();

},[]);

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

<Route 
index 
element={
<ProtectedRoute permission="dashboard">
<DashboardModule/>
</ProtectedRoute>
}
/>


<Route 
path="stores"
element={
<ProtectedRoute permission="stores">
<StoresModule/>
</ProtectedRoute>
}
/>


<Route 
path="products"
element={
<ProtectedRoute permission="products">
<ProductsModule/>
</ProtectedRoute>
}
/>


<Route 
path="inventory"
element={
<ProtectedRoute permission="inventory">
<InventoryModule/>
</ProtectedRoute>
}
/>


<Route 
path="sales"
element={
<ProtectedRoute permission="sales">
<SalesModule/>
</ProtectedRoute>
}
/>


<Route 
path="payments"
element={
<ProtectedRoute permission="payments">
<PaymentsModule/>
</ProtectedRoute>
}
/>


<Route 
path="users"
element={
<ProtectedRoute permission="users">
<UsersModule/>
</ProtectedRoute>
}
/>


<Route 
path="customers"
element={
<ProtectedRoute permission="customers">
<CustomersModule/>
</ProtectedRoute>
}
/>


<Route 
path="expenses"
element={
<ProtectedRoute permission="expenses">
<ExpensesModule/>
</ProtectedRoute>
}
/>


<Route 
path="suppliers"
element={
<ProtectedRoute permission="suppliers">
<SuppliersModule/>
</ProtectedRoute>
}
/>


<Route 
path="payroll"
element={
<ProtectedRoute permission="payroll">
<PayrollModule/>
</ProtectedRoute>
}
/>


<Route 
path="reports"
element={
<ProtectedRoute permission="reports">
<ReportsModule/>
</ProtectedRoute>
}
/>


</Route>
    </Routes>
  );
}
