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
import AuditModule from "./admin/modules/AuditModule";
import PendingRequestsModule from "./admin/modules/PendingRequestsModule";
import StockCountModule from "./admin/modules/StockCountModule";
import StockCountDetail from "./admin/modules/stock-count/StockCountDetail";
import SubscriptionExpiredScreen from "./admin/modules/billing/SubscriptionExpiredScreen";
import BillingModule from "./admin/modules/BillingModule";
import PlatformPaymentsPage from "./pages/platform/PlatformPaymentsPage";
import PlatformAuthGate from "./guards/PlatformAuthGate";
import PlatformLogin from "./pages/platform/PlatformLogin";
import PlatformLayout from "./pages/platform/PlatformLayout";
import CompaniesListPage from "./pages/platform/CompaniesListPage";
import CompanyDetailPage from "./pages/platform/CompanyDetailPage";
import PlatformAnalyticsPage from "./pages/platform/PlatformAnalyticsPage";
import PlatformPlansPage from "./pages/platform/PlatformPlansPage";
import PlatformBroadcastPage from "./pages/platform/PlatformBroadcastPage";
import PlatformAuditLogPage from "./pages/platform/PlatformAuditLogPage";
import SupportModule from "./admin/modules/SupportModule";
import SupportThreadDetail from "./admin/modules/support/SupportThreadDetail";
import PlatformSupportInboxPage from "./pages/platform/PlatformSupportInboxPage";
import PlatformSupportThreadDetailPage from "./pages/platform/PlatformSupportThreadDetailPage";


import AuthGate from "./guards/AuthGate";
import useAuthStore from "./store/useAuthStore";
import ProtectedRoute from "./guards/ProtectedRoute";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/platform/login" element={<PlatformLogin />} />

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
              <DashboardModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="billing"
          element={
            <ProtectedRoute permission="billing">
              <BillingModule />
            </ProtectedRoute>
          }
        />
  <Route
  path="support"
  element={
    <ProtectedRoute permission="support">
      <SupportModule/>
    </ProtectedRoute>
  }
/>
<Route
  path="support/:id"
  element={
    <ProtectedRoute permission="support">
      <SupportThreadDetail/>
    </ProtectedRoute>
  }
/>

        <Route
          path="stores"
          element={
            <ProtectedRoute permission="stores">
              <StoresModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock-count"
          element={
            <ProtectedRoute permission="inventory">
              <StockCountModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="stock-count/:id"
          element={
            <ProtectedRoute permission="inventory">
              <StockCountDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="pending-requests"
          element={
            <ProtectedRoute permission="audit">
              <PendingRequestsModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="audit"
          element={
            <ProtectedRoute permission="audit">
              <AuditModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="products"
          element={
            <ProtectedRoute permission="products">
              <ProductsModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="inventory"
          element={
            <ProtectedRoute permission="inventory">
              <InventoryModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="sales"
          element={
            <ProtectedRoute permission="sales">
              <SalesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="payments"
          element={
            <ProtectedRoute permission="payments">
              <PaymentsModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute permission="users">
              <UsersModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="customers"
          element={
            <ProtectedRoute permission="customers">
              <CustomersModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="expenses"
          element={
            <ProtectedRoute permission="expenses">
              <ExpensesModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="suppliers"
          element={
            <ProtectedRoute permission="suppliers">
              <SuppliersModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="payroll"
          element={
            <ProtectedRoute permission="payroll">
              <PayrollModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <ProtectedRoute permission="reports">
              <ReportsModule />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Platform Area (sibling of admin, not nested) */}
      <Route
        path="/platform"
        element={
          <PlatformAuthGate>
            <PlatformLayout />
          </PlatformAuthGate>
        }
      >
        <Route path="payments" element={<PlatformPaymentsPage />} />
        <Route path="companies" element={<CompaniesListPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />
        <Route path="analytics" element={<PlatformAnalyticsPage />} />
        <Route path="plans" element={<PlatformPlansPage />} />
        <Route path="broadcast" element={<PlatformBroadcastPage />} />
        <Route path="audit-log" element={<PlatformAuditLogPage />} />
        <Route path="support" element={<PlatformSupportInboxPage />} />
        <Route path="support/:id" element={<PlatformSupportThreadDetailPage />} />
      </Route>
    </Routes>
  );
}