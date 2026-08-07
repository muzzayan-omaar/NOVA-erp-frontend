import { useNavigate } from "react-router-dom";
import {
  X,
  Package,
  PackageCheck,
  PackageX,
  LogIn,
  LogOut,
  AlertTriangle,
  Bell,
  ThumbsUp,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import api from "../../../../services/api";

const iconMap = {
  LOW_STOCK: PackageX,
  STOCK_RECEIVED: PackageCheck,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  ALERT: AlertTriangle,
  SALE: Package,
  INVENTORY: Package,
  APPROVAL_REQUEST: ShieldAlert,
  SYSTEM: Bell,
  DEFAULT: Bell
};

const priorityStyles = {
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-blue-100 text-blue-700"
};

// Static actions for notification types where the destination never
// depends on who's looking at it.
const notificationActions = {
  LOW_STOCK: {
    label: "View inventory",
    path: "/admin/products",
    acknowledge: false
  },
  STOCK_RECEIVED: {
    label: "View inventory",
    path: "/admin/products",
    acknowledge: false
  },
  SALE: {
    label: "View sales",
    path: "/admin/sales",
    acknowledge: false
  },
  LOGIN: {
    label: "Acknowledge",
    path: null,
    acknowledge: true
  },
  LOGOUT: {
    label: "Acknowledge",
    path: null,
    acknowledge: true
  },
  FAILED_LOGIN: {
    label: "Acknowledge",
    path: null,
    acknowledge: true
  },
  INVENTORY: {
    label: "View stock counts",
    path: "/admin/stock-count",
    acknowledge: false
  },
  SYSTEM: {
    label: "Acknowledge",
    path: null,
    acknowledge: true
  }
};

// APPROVAL_REQUEST is used for two different audiences:
// - the GM gets "Void/Refund Request" (needs to review + approve)
// - the cashier gets "Request Approved/Rejected" (just needs to see the outcome)
// so its destination depends on who's viewing it, not just the type.
const resolveAction = (notification, currentUserRole) => {
  if (notification.type === "APPROVAL_REQUEST") {
    if (currentUserRole === "GENERAL_MANAGER") {
      return {
        label: "Review request",
        path: "/admin/pending-requests",
        acknowledge: false
      };
    }
    return {
      label: "View sale",
      path: "/admin/sales",
      acknowledge: false
    };
  }

  return notificationActions[notification.type] || null;
};

export default function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  setNotifications,
  currentUserRole
}) {
  if (!open) return null;

  const navigate = useNavigate();

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed marking notification", error);
    }
  };

  const handleAction = (notification) => {
    const action = resolveAction(notification, currentUserRole);

    if (!action) return;

    markAsRead(notification.id);

    if (action.path) {
      navigate(action.path);
      onClose();
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

            const action = resolveAction(notification, currentUserRole);

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
                        {notification.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {action && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm flex items-center gap-2"
                        >
                          {action.acknowledge ? (
                            <ThumbsUp size={15} />
                          ) : (
                            <ExternalLink size={15} />
                          )}
                          {action.label}
                        </button>
                      )}

                      {!notification.isRead && (!action || !action.acknowledge) && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm"
                        >
                          Mark as read
                        </button>
                      )}
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