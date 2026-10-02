import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import logo from "../../../../public/favicon.png";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  LifeBuoy,
  Clock,
  Lock,
} from "lucide-react";

const STATUS_STYLES = {
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
};

function formatMessageTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) {
    return "Today";
  }
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function SupportThreadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchThread = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/support/threads/${id}`);
      setThread(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load conversation");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || thread?.status === "CLOSED") return;

    try {
      setSending(true);
      await api.post(`/support/threads/${id}/reply`, {
        message: reply.trim(),
      });
      setReply("");
      await fetchThread(true);
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-center py-20 text-slate-500">Loading conversation…</p>;
  }

  if (!thread) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-500">Conversation not found</p>
        <button
          onClick={() => navigate("/admin/support")}
          className="text-nova-blue text-sm font-medium hover:underline"
        >
          Back to Support
        </button>
      </div>
    );
  }

  const isClosed = thread.status === "CLOSED";
  const messages = thread.messages || [];

  // Group messages by day for separators
  const grouped = [];
  let lastDay = null;
  for (const m of messages) {
    const key = dayKey(m.createdAt);
    if (key !== lastDay) {
      grouped.push({ type: "day", key, label: dayLabel(m.createdAt) });
      lastDay = key;
    }
    grouped.push({ type: "message", data: m });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/admin/support")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
        >
          <ArrowLeft size={18} /> Inbox
        </button>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            STATUS_STYLES[thread.status] || STATUS_STYLES.CLOSED
          }`}
        >
          {thread.status}
        </span>
      </div>

      {/* Conversation card */}
      <div className="bg-white rounded-3xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden border border-slate-100">
        {/* Thread header */}
        <div className="px-5 py-4 border-b bg-slate-50/80 flex items-start gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
  <img src={logo} alt="Novrr" className="w-full h-full object-contain" />
</div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-nova-900 truncate">{thread.subject}</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock size={11} />
              Started{" "}
              {new Date(thread.createdAt || messages[0]?.createdAt).toLocaleDateString(
                undefined,
                { dateStyle: "medium" }
              )}
              {messages.length > 0 && (
                <span className="text-slate-400">
                  · {messages.length} message{messages.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {grouped.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">
              No messages in this thread yet
            </p>
          ) : (
            grouped.map((item, idx) => {
              if (item.type === "day") {
                return (
                  <div
                    key={`day-${item.key}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                );
              }

              const m = item.data;
              const isMine = Boolean(m.senderUserId);
              const name = isMine
                ? m.senderUser?.name || "You"
                : m.senderPlatformAdmin?.name || "Novrr Support";

              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] ${
                      isMine ? "items-end" : "items-start"
                    } flex flex-col gap-1`}
                  >
                    {/* Avatar + name row for Nova messages */}
                    {!isMine && (
  <div className="flex items-center gap-2 px-1">
    <div className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center overflow-hidden p-0.5">
      <img src={logo} alt="Novrr" className="w-full h-full object-contain" />
    </div>
    <span className="text-[11px] font-semibold text-slate-500">
      {name}
    </span>
  </div>
)}

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isMine
                          ? "bg-nova-900 text-white rounded-br-md"
                          : "bg-slate-100 text-slate-800 rounded-bl-md"
                      }`}
                    >
                      {isMine && (
                        <p className="text-[11px] font-medium text-white/60 mb-1">
                          {name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {m.body}
                      </p>
                      <p
                        className={`text-[10px] mt-1.5 ${
                          isMine ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        {formatMessageTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {isClosed ? (
          <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-center gap-2 text-sm text-slate-500 flex-shrink-0">
            <Lock size={14} />
            This conversation is closed. Open a new message from Support if you
            need more help.
          </div>
        ) : (
          <form
            onSubmit={handleReply}
            className="p-4 border-t bg-white flex gap-2 items-end flex-shrink-0"
          >
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 p-3 border rounded-2xl resize-none text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-nova-blue/30"
              placeholder="Write a reply to Novrr…"
              value={reply}
              onChange={(e) => {
                setReply(e.target.value);
                // auto-grow
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(e);
                }
              }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="bg-nova-gradient text-white p-3 rounded-2xl disabled:opacity-40 hover:opacity-90 transition flex-shrink-0"
              title="Send (Enter)"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

      {!isClosed && (
        <p className="text-center text-[11px] text-slate-400 flex-shrink-0">
          Enter to send · Shift+Enter for a new line
        </p>
      )}
    </div>
  );
}