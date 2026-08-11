import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Inbox,
  CreditCard,
  FileText,
  Receipt,
  LogOut,
  Boxes,
  Truck,
  UserCog,
  Building2,
  ShieldAlert,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/hasPermission";
import StoreSwitcher from "../../components/StoreSwitcher";
import NotificationBell from "../../admin/modules/dashboard/components/NotificationBell";
import NotificationDrawer from "../../admin/modules/dashboard/components/NotificationDrawer";
import SubscriptionExpiredScreen from "../../admin/modules/billing/SubscriptionExpiredScreen";

import logo from "../../assets/logo.png"; 

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [switchingStore, setSwitchingStore] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("Overview");

  // ── Subscription status ──────────────────────────────────────
  const fetchSubStatus = async () => {
    try {
      const res = await api.get("/subscription/status");
      setSubStatus(res.data);
    } catch (err) {
      console.error("Subscription status check failed", err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchSubStatus();
  }, []);

  // ── Notifications ────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Notification fetch failed", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Stores ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores");
        setStores(res.data);

        const currentRes = await api.get("/stores/current");
        setCurrentStore(currentRes.data);
      } catch (err) {
        console.error("STORE FETCH ERROR:", err.response?.data);
        if (err.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          logout();
          navigate("/login");
        }
      }
    };
    fetchStores();
  }, []);

  // Auto-open the group that contains the current page
  useEffect(() => {
    const currentPath = location.pathname;
    for (const group of menuGroups) {
      if (group.items.some((item) => item.path === currentPath)) {
        setOpenGroup(group.title);
        break;
      }
    }
  }, [location.pathname]);

  const handleStoreSwitch = async (e) => {
    const selectedStoreId = e.target.value;
    const selected = stores.find((store) => store.id === selectedStoreId);
    if (!selected) return;

    try {
      setSwitchingStore(true);
      const res = await api.post("/stores/switch", { storeId: selectedStoreId });
      const updatedUser = res.data.user;

      useAuthStore.getState().setAuth(updatedUser, localStorage.getItem("token"));
      setCurrentStore(selected);
      toast.success(`Switched to ${selected.name}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to switch store");
    } finally {
      setSwitchingStore(false);
    }
  };

  const menuGroups = [
    {
      title: "Overview",
      items: [{ title: "Dashboard", icon: LayoutDashboard, path: "/admin", permission: "dashboard" }],
    },
    {
      title: "Business",
      items: [
        { title: "Stores", icon: Building2, path: "/admin/stores", permission: "stores" },
        { title: "Users", icon: UserCog, path: "/admin/users", permission: "users" },
        { title: "Payroll", icon: Receipt, path: "/admin/payroll", permission: "payroll" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { title: "Products", icon: Package, path: "/admin/products", permission: "products" },
        { title: "Inventory", icon: Boxes, path: "/admin/inventory", permission: "inventory" },
        { title: "Stock Count", icon: ClipboardList, path: "/admin/stock-count", permission: "inventory" },
        { title: "Suppliers", icon: Truck, path: "/admin/suppliers", permission: "suppliers" },
      ],
    },
    {
      title: "Sales",
      items: [
        { title: "Sales", icon: ShoppingCart, path: "/admin/sales", permission: "sales" },
        { title: "Customers", icon: Users, path: "/admin/customers", permission: "customers" },
        { title: "Payments", icon: CreditCard, path: "/admin/payments", permission: "payments" },
      ],
    },
    {
      title: "Finance",
      items: [
        { title: "Expenses", icon: DollarSign, path: "/admin/expenses", permission: "expenses" },
        { title: "Billing", icon: CreditCard, path: "/admin/billing", permission: "billing" },
        { title: "Reports", icon: FileText, path: "/admin/reports", permission: "reports" },
      ],
    },
    {
      title: "Oversight",
      items: [
        { title: "Pending Requests", icon: Inbox, path: "/admin/pending-requests", permission: "audit" },
        { title: "Audit Log", icon: ShieldAlert, path: "/admin/audit", permission: "audit" },
      ],
    },
    {
      title: "Help",
      items: [
        { title: "Support", icon: LifeBuoy, path: "/admin/support", permission: "support" },
      ],
    },
  ];

  const handleGroupToggle = (title) => {
    setOpenGroup(title);
  };

  // ── Early returns for subscription states ────────────────────
  if (subLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (subStatus && !subStatus.active && user?.role === "GENERAL_MANAGER") {
    return (
      <SubscriptionExpiredScreen
        status={subStatus}
        onRenewed={fetchSubStatus}
      />
    );
  }

  // ── Normal layout ────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
  <img
    src={logo}
    alt="Nova ERP"
    className="w-10 h-10 rounded-lg object-contain"
  />
  <div>
    <h1 className="text-xl font-bold tracking-tight leading-tight">Nova ERP</h1>
    <p className="text-slate-400 text-xs">Business Control Center</p>
  </div>
</div>

        {/* Store Switcher */}
        {hasPermission(user?.role, "stores") && (
          <div className="px-6 py-5 border-b border-slate-800">
            <StoreSwitcher
              stores={stores}
              currentStore={currentStore}
              onSwitch={handleStoreSwitch}
              switchingStore={switchingStore}
            />
          </div>
        )}

        {hasPermission(user?.role, "pos") && (
          <div className="px-3 pt-3">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-3 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all"
            >
              <ShoppingCart size={18} />
              Go to POS
            </button>
          </div>
        )}

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-sidebar-scroll">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasPermission(user?.role, item.permission)
            );
            if (visibleItems.length === 0) return null;

            const isOpen = openGroup === group.title;

            return (
              <div key={group.title}>
                <button
                  onClick={() => handleGroupToggle(group.title)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800 transition-all duration-200 rounded-xl"
                >
                  <span className="font-semibold text-sm tracking-wider text-slate-200">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-3 pr-3 pb-2 space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-6 py-3 rounded-xl text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                              : "hover:bg-slate-800 text-slate-300 hover:text-white"
                          }`}
                        >
                          <item.icon
                            size={18}
                            className={isActive ? "text-white" : "text-slate-400"}
                          />
                          <span className="font-medium">{item.title}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-800 mx-4 my-1" />
              </div>
            );
          })}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Trial banner (GM only) */}
        {user?.role === "GENERAL_MANAGER" &&
          subStatus?.active &&
          subStatus.subscription?.status === "TRIALING" && (
            <div className="bg-blue-600 text-white px-6 py-2 text-sm flex justify-between items-center shrink-0">
              <span>
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(subStatus.subscription.endDate) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{" "}
                day(s) left in your free trial
              </span>
              <button
                onClick={() => navigate("/admin/billing")}
                className="underline font-medium"
              >
                Upgrade now
              </button>
            </div>
          )}

          {user?.__investigation && (
  <div className="bg-amber-500 text-white px-6 py-2 text-sm flex justify-between items-center">
    <span>
      🔍 Viewing as support — impersonating {user.name} at {user.__investigation.companyName}. Every action here is logged.
    </span>
    <button
      onClick={() => {
        logout();
        window.close();
        navigate("/platform/login");
      }}
      className="underline font-medium"
    >
      End Investigation
    </button>
  </div>
)}

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </div>

      {/* Floating Notification Bell */}
      <div className="fixed bottom-6 right-8 z-30">
        <NotificationBell
          unreadCount={notifications.filter((n) => !n.isRead).length}
          onClick={() => setDrawerOpen(true)}
        />
      </div>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        currentUserRole={user?.role}
      />
    </div>
  );
}