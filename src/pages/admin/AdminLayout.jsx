import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingCart, CreditCard, FileText, Receipt, LogOut, Boxes, Truck, UserCog, } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Products", icon: Package, path: "/admin/products" },
  { title: "Inventory", icon: Boxes, path: "/admin/inventory" },
  { title: "Sales", icon: ShoppingCart, path: "/admin/sales" },
  { title: "Payments", icon: CreditCard, path: "/admin/payments" },
  { title: "Customers", icon: Users, path: "/admin/customers" },
  { title: "Suppliers", icon: Truck, path: "/admin/suppliers" },
  { title: "Users", icon: UserCog, path: "/admin/users" },
  { title: "Reports", icon: FileText, path: "/admin/reports" },
];

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">Nova ERP</h1>
          <p className="text-slate-400 text-sm">Business Control Center</p>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? "bg-slate-700" : "hover:bg-slate-800"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}