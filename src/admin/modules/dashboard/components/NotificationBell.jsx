import { Bell } from "lucide-react";

export default function NotificationBell({ unreadCount = 0, onClick }) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative h-14 w-14 rounded-2xl border bg-white shadow-nova transition flex items-center justify-center hover:scale-105 ${
        hasUnread ? "border-nova-blue/30" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      {/* Pulsing ring, only while there's something unread */}
      {hasUnread && (
        <span className="absolute inset-0 rounded-2xl bg-nova-blue/10 animate-ping" />
      )}

      <Bell
        size={22}
        className={
          hasUnread
            ? "text-nova-blue animate-[wiggle_2.5s_ease-in-out_infinite]"
            : "text-slate-600"
        }
      />

      {hasUnread && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}