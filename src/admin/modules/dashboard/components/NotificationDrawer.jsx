import { useEffect, useState } from "react";
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
  BellOff,
  ThumbsUp,
  ExternalLink,
  ShieldAlert,
  CheckCheck,
} from "lucide-react";
import api from "../../../../services/api";
import { formatRelativeTime } from "../../../../utils/formatRelativeTime";

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
  DEFAULT: Bell,
};

const iconTintMap = {
  LOW_STOCK: "bg-amber-50 text-amber-600",
  STOCK_RECEIVED: "bg-emerald-50 text-emerald-600",
  LOGIN: "bg-slate-100 text-slate-500",
  LOGOUT: "bg-slate-100 text-slate-500",
  ALERT: "bg-red-50 text-red-600",
  SALE: "bg-blue-50 text-nova-blue",
  INVENTORY: "bg-blue-50 text-nova-blue",
  APPROVAL_REQUEST: "bg-violet-50 text-violet-600",
  SYSTEM: "bg-slate-100 text-slate-500",
  DEFAULT: "bg-slate-100 text-slate-500",
};

const priorityStyles = {
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-nova-blue",
};

const notificationActions = {
  LOW_STOCK: { label: "View inventory", path: "/admin/products", acknowledge: false },
  STOCK_RECEIVED: { label: "View inventory", path: "/admin/products", acknowledge: false },
  SALE: { label: "View sales", path: "/admin/sales", acknowledge: false },
  LOGIN: { label: "Acknowledge", path: null, acknowledge: true },
  LOGOUT: { label: "Acknowledge", path: null, acknowledge: true },
  FAILED_LOGIN: { label: "Acknowledge", path: null, acknowledge: true },
  INVENTORY: { label: "View stock counts", path: "/admin/stock-count", acknowledge: false },
  SYSTEM: { label: "Acknowledge", path: null, acknowledge: true },
};

const resolveAction = (notification, currentUserRole) => {
  if (notification.type === "APPROVAL_REQUEST") {
    if (currentUserRole === "GENERAL_MANAGER") {
      return { label: "Review request", path: "/admin/pending-requests", acknowledge: false };
    }
    return { label: "View sale", path: "/admin/sales", acknowledge: false };
  }
  return notificationActions[notification.type] || null;
};

export default function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  setNotifications,
  currentUserRole,
}) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (open) {
      // Two nested rAFs guarantee the browser has painted the closed
      // (translate-x-full) position at least once before we flip to open —
      // a single rAF isn't reliably enough for the transition to actually
      // animate rather than snap straight to its end state.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true));
      });
    } else {
      setMounted(false);
    }
  }, [open]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed marking notification", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      setMarkingAll(true);
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed marking all as read", error);
    } finally {
      setMarkingAll(false);
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
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-nova-950/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-50 shadow-nova flex flex-col transition-transform duration-300 ease-out ${
          mounted ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-nova-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-nova-gradient text-white px-2.5 py-1 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Business alerts and activity</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
            aria-label="Close notifications"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="px-6 py-3 border-b border-slate-100">
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm font-medium text-nova-blue hover:underline disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {markingAll ? "Marking all read..." : "Mark all as read"}
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {notifications.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <BellOff size={40} className="text-slate-300" />
              <p>You're all caught up</p>
            </div>
          )}

          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || iconMap.DEFAULT;
            const tint = iconTintMap[notification.type] || iconTintMap.DEFAULT;
            const action = resolveAction(notification, currentUserRole);

            return (
              <div
                key={notification.id}
                className={`rounded-2xl p-4 border transition ${
                  notification.isRead
                    ? "bg-white border-slate-100"
                    : "bg-blue-50/60 border-nova-blue/20"
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + time + unread dot */}
                    <div className="flex justify-between gap-2 items-start">
                      <h3 className="font-semibold text-nova-900 text-sm leading-snug">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[11px] text-slate-400 whitespace-nowrap"
                          title={
                            notification.createdAt
                              ? new Date(notification.createdAt).toLocaleString()
                              : undefined
                          }
                        >
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-nova-blue" />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Priority + type chips */}
                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          priorityStyles[notification.priority] || priorityStyles.LOW
                        }`}
                      >
                        {notification.priority}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
                        {notification.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {action && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="px-4 py-2 rounded-xl bg-nova-900 text-white text-sm flex items-center gap-2 hover:bg-nova-800 transition"
                        >
                          {action.acknowledge ? (
                            <ThumbsUp size={14} />
                          ) : (
                            <ExternalLink size={14} />
                          )}
                          {action.label}
                        </button>
                      )}

                      {!notification.isRead && (!action || !action.acknowledge) && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
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