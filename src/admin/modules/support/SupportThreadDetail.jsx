import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Send } from "lucide-react";

export default function SupportThreadDetail() {
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
      const res = await api.get(`/support/threads/${id}`);
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
      await api.post(`/support/threads/${id}/reply`, { message: reply });
      setReply("");
      fetchThread();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!thread) return <p className="text-center py-20">Conversation not found</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate("/admin/support")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Support
      </button>

      <div className="bg-white rounded-3xl shadow flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold">{thread.subject}</h1>
              <p className="text-sm text-slate-500 mt-1">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    thread.status === "OPEN" ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {thread.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {thread.messages.map((m) => {
            // Company messages have senderUserId → show on the right as "You"
            const isMine = Boolean(m.senderUserId);

            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isMine ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {isMine
                      ? m.senderUser?.name || "You"
                      : m.senderPlatformAdmin?.name || "Nova Support"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={`text-xs mt-2 ${
                      isMine ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply form */}
        <form onSubmit={handleReply} className="p-4 border-t flex gap-3">
          <input
            className="flex-1 p-3 border rounded-2xl"
            placeholder="Type a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={thread.status === "CLOSED"}
          />
          <button
            type="submit"
            disabled={sending || thread.status === "CLOSED"}
            className="bg-blue-600 text-white px-5 rounded-2xl disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}