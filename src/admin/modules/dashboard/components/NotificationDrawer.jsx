import { useNavigate } from "react-router-dom";
import {
  X,
  Package,
  PackageCheck,
  PackageX,
  LogIn,
  LogOut,
  Target,
  AlertTriangle,
  Bell,
  ExternalLink,
  Check,
} from "lucide-react";

const iconMap = {
  LOW_STOCK: PackageX,
  STOCK_RECEIVED: PackageCheck,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  TARGET: Target,
  ALERT: AlertTriangle,
  SALE: Package,
  SALE_COMPLETED: PackageCheck,
  INVENTORY: Package,
  SYSTEM: Bell,
  FAILED_LOGIN: AlertTriangle,
  DEFAULT: Bell,
};

const priorityStyles = {
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-blue-100 text-blue-700",
};

export default function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  onRead,
}) {
  if (!open) return null;

  const navigate = useNavigate();

  const handleAction = (notification) => {
    // Mark as read + close drawer first
    onRead?.(notification.id);
    onClose();

    switch (notification.type) {
      case "LOW_STOCK":
        navigate(
          `/inventory/products/${notification.metadata?.productId}`
        );
        break;

      case "SALE_COMPLETED":
        navigate(`/sales/${notification.metadata?.saleId}`);
        break;

      case "PAYROLL_PENDING":
        navigate("/payroll");
        break;

      default:
        // already marked read above
        break;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-slate-500">
              Business alerts and activities
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {notifications.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400">
              No notifications
            </div>
          )}

          {notifications.map((notification) => {
            const Icon =
              iconMap[notification.type] || iconMap.DEFAULT;

            return (
              <div
                key={notification.id}
                className={`rounded-2xl p-4 border transition ${
                  notification.isRead
                    ? "bg-white"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon size={20} />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-semibold">
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mt-1">
                      {notification.message}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          priorityStyles[notification.priority] ||
                          priorityStyles.LOW
                        }`}
                      >
                        {notification.priority}
                      </span>

                      <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                        {notification.type}
                      </span>
                    </div>

                    {/* Type-specific action buttons */}
                    <div className="mt-4 flex justify-end gap-2 flex-wrap">
                      {/* Critical / actionable types */}
                      {notification.type === "LOW_STOCK" && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          <ExternalLink size={15} />
                          View Product
                        </button>
                      )}

                      {notification.type === "SALE_COMPLETED" && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          <ExternalLink size={15} />
                          View Sale
                        </button>
                      )}

                      {notification.type === "PAYROLL_PENDING" && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          <ExternalLink size={15} />
                          Open Payroll
                        </button>
                      )}

                      {/* Optional: mark as read without navigating (while unread) */}
                      {!notification.isRead &&
                        (notification.type === "LOW_STOCK" ||
                          notification.type === "SALE_COMPLETED" ||
                          notification.type === "PAYROLL_PENDING") && (
                          <button
                            onClick={() => onRead?.(notification.id)}
                            className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm"
                          >
                            <Check size={15} />
                            Mark as read
                          </button>
                        )}

                      {/* Login / low-priority — Acknowledge → Acknowledged */}
                      {(notification.type === "LOGIN" ||
                        notification.type === "LOGOUT" ||
                        notification.type === "FAILED_LOGIN" ||
                        notification.type === "SYSTEM") &&
                        (notification.isRead ? (
                          <span className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-sm">
                            <Check size={15} />
                            Acknowledged
                          </span>
                        ) : (
                          <button
                            onClick={() => onRead?.(notification.id)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                          >
                            <Check size={15} />
                            Acknowledge
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}