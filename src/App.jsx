import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import POS from "./pages/POS";
import AdminLayout from "./pages/admin/AdminLayout";

import AuthGate from "./guards/AuthGate";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <AuthGate>
            <POS />
          </AuthGate>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <AuthGate>
            <AdminLayout />
          </AuthGate>
        }
      />
    </Routes>
  );
}

export default App;