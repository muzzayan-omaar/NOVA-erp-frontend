import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { ArrowLeft, Send, Building2 } from "lucide-react";

export default function PlatformSupportThreadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get(`/platform/support/threads/${id}`);
      setThread(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      setSending(true);
      await platformApi.post(`/platform/support/threads/${id}/reply`, { message: reply });
      setReply("");
      fetchThread();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    const next = thread.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await platformApi.patch(`/platform/support/threads/${id}/status`, { status: next });
      toast.success(next === "CLOSED" ? "Thread closed" : "Thread reopened");
      fetchThread();
    } catch (err) {
      toast.error("Failed to update thread status");
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!thread) return <p className="text-center py-20">Conversation not found</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate("/platform/support")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Inbox
      </button>

      <div className="bg-white rounded-3xl shadow flex flex-col h-[600px]">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">{thread.subject}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Building2 size={14} /> {thread.company?.name}
            </p>
          </div>
          <button
            onClick={toggleStatus}
            className={`text-xs px-3 py-2 rounded-xl font-semibold ${
              thread.status === "OPEN"
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
          >
            {thread.status === "OPEN" ? "Close Thread" : "Reopen Thread"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {thread.messages.map((m) => {
            const isCompany = Boolean(m.senderUserId);
            return (
              <div key={m.id} className={`flex ${isCompany ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 ${
                  isCompany ? "bg-slate-100" : "bg-blue-600 text-white"
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${isCompany ? "text-slate-500" : "text-blue-100"}`}>
                    {isCompany ? m.senderUser?.name : m.senderPlatformAdmin?.name || "You"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p className={`text-xs mt-2 ${isCompany ? "text-slate-400" : "text-blue-100"}`}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleReply} className="p-4 border-t flex gap-3">
          <input
            className="flex-1 p-3 border rounded-2xl"
            placeholder="Type a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 text-white px-5 rounded-2xl disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}