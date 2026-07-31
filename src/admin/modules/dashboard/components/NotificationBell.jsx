import { Bell } from "lucide-react";

export default function NotificationBell({
    unreadCount = 0,
    onClick,
}) {
    return (
        <button
            onClick={onClick}
            className="
                relative
                h-12
                w-12
                rounded-2xl
                border
                border-slate-200
                bg-white
                hover:bg-slate-50
                transition
                flex
                items-center
                justify-center
            "
        >
            <Bell size={22} />

            {unreadCount > 0 && (
                <span
                    className="
                        absolute
                        -top-1
                        -right-1
                        min-w-[20px]
                        h-5
                        px-1
                        rounded-full
                        bg-red-600
                        text-white
                        text-xs
                        font-bold
                        flex
                        items-center
                        justify-center
                    "
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </button>
    );
}