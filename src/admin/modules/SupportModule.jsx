import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  X,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

const STATUS_STYLES = {
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
};

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function SupportModule() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OPEN | CLOSED | UNREAD

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/support/threads");
      setThreads(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load support threads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/support/threads", {
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success("Message sent to Nova support");
      setForm({ subject: "", message: "" });
      setShowForm(false);
      navigate(`/admin/support/${res.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = threads.filter((t) => t.status === "OPEN").length;
  const unreadCount = threads.filter((t) => t.hasNewReply).length;
  const closedCount = threads.filter((t) => t.status === "CLOSED").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return threads.filter((t) => {
      if (statusFilter === "OPEN" && t.status !== "OPEN") return false;
      if (statusFilter === "CLOSED" && t.status !== "CLOSED") return false;
      if (statusFilter === "UNREAD" && !t.hasNewReply) return false;

      if (!q) return true;
      const hay = [t.subject, t.lastMessagePreview, t.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [threads, search, statusFilter]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
             Support Chatbox
          </h1>
          <p className="text-slate-500 mt-1 max-w-md">
            Talk directly to the Novrr team. Billing, bugs, training, feature
            requests — we read every message.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition flex-shrink-0"
        >
          {showForm ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <Plus size={20} /> New message
            </>
          )}
        </button>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("OPEN")}
          className={`bg-white rounded-3xl p-4 shadow-sm text-left transition ring-offset-2 ${
            statusFilter === "OPEN" ? "ring-2 ring-nova-blue" : "hover:bg-slate-50"
          }`}
        >
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CircleDot size={12} /> Open
          </p>
          <p className="font-semibold mt-1 text-lg">{openCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("UNREAD")}
          className={`bg-white rounded-3xl p-4 shadow-sm text-left transition ring-offset-2 ${
            statusFilter === "UNREAD"
              ? "ring-2 ring-nova-blue"
              : "hover:bg-slate-50"
          }`}
        >
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MessageCircle size={12} /> New replies
          </p>
          <p
            className={`font-semibold mt-1 text-lg ${
              unreadCount > 0 ? "text-nova-blue" : ""
            }`}
          >
            {unreadCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("CLOSED")}
          className={`bg-white rounded-3xl p-4 shadow-sm text-left transition ring-offset-2 ${
            statusFilter === "CLOSED"
              ? "ring-2 ring-nova-blue"
              : "hover:bg-slate-50"
          }`}
        >
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Closed
          </p>
          <p className="font-semibold mt-1 text-lg">{closedCount}</p>
        </button>
      </div>

      {/* Compose */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <div>
            <h2 className="font-bold text-lg">Message Nova support</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Include your company name, store, and what you were trying to do
              if it’s a bug report — that helps us respond faster.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              placeholder="e.g. Can’t switch stores on mobile"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea
              rows={5}
              className="w-full p-3 border rounded-2xl mt-1 resize-none"
              placeholder="Describe the issue or question in as much detail as you can…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send to Nova"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-2xl border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search + filter */}
      {threads.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm"
            >
              <option value="ALL">All conversations</option>
              <option value="OPEN">Open only</option>
              <option value="UNREAD">New replies</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      )}

      {/* Inbox */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Your conversations with Nova
          </p>
          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="text-xs text-nova-blue hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-16">Loading...</p>
        ) : filtered.length === 0 && threads.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700">No conversations yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Stuck on something? Billing question? Feature idea? Send a message
              — a real person on the Nova team will reply.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-2 bg-nova-gradient text-white px-5 py-2.5 rounded-2xl text-sm font-semibold"
            >
              <Plus size={16} /> Write your first message
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-16">
            No conversations match this filter
          </p>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/admin/support/${t.id}`)}
                className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition flex gap-4 items-start ${
                  t.hasNewReply ? "bg-blue-50/40" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    t.hasNewReply
                      ? "bg-nova-blue text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <MessageCircle size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`truncate ${
                        t.hasNewReply
                          ? "font-bold text-nova-900"
                          : "font-semibold text-slate-800"
                      }`}
                    >
                      {t.subject}
                    </p>
                    {t.hasNewReply && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-nova-blue text-white">
                        New reply
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {t.lastMessagePreview || "No messages yet"}
                  </p>
                </div>

                <div className="text-right flex-shrink-0 space-y-1.5">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED
                    }`}
                  >
                    {t.status}
                  </span>
                  <p className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {formatWhen(t.lastMessageAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer reassurance */}
      <p className="text-center text-xs text-slate-400 pb-4">
        Typical reply time is within one business day. Urgent outages — mention
        “URGENT” in the subject.
      </p>
    </div>
  );
}