import { Outlet, useNavigate, useLocation } from "react-router-dom";
import usePlatformAuthStore from "../../store/usePlatformAuthStore";
import { ShieldCheck, LogOut, Inbox, Building2, TrendingUp, CreditCard } from "lucide-react";

const menuItems = [
  { title: "Companies", icon: Building2, path: "/platform/companies" },
  { title: "Payments", icon: Inbox, path: "/platform/payments" },
  { title: "Analytics", icon: TrendingUp, path: "/platform/analytics" },
  { title: "Plans", icon: CreditCard, path: "/platform/plans" },
];

export default function PlatformLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = usePlatformAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/platform/login");
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <ShieldCheck className="text-blue-400" size={26} />
          <div>
            <p className="font-bold">Nova Platform</p>
            <p className="text-xs text-slate-400">{admin?.name}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                  active ? "bg-blue-600" : "hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                {item.title}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-slate-800 text-red-400"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}