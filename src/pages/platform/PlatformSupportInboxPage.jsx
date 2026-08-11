import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { LifeBuoy, MessageCircle } from "lucide-react";

export default function PlatformSupportInboxPage() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get("/platform/support/threads");
      setThreads(res.data);
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

  const filtered = threads.filter((t) => {
    if (filter === "Needs Reply") return t.needsReply;
    if (filter === "Open") return t.status === "OPEN";
    if (filter === "Closed") return t.status === "CLOSED";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <LifeBuoy /> Support Inbox
        </h1>
        <select
          className="p-3 border rounded-2xl"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All</option>
          <option>Needs Reply</option>
          <option>Open</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
            No conversations here.
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/platform/support/${t.id}`)}
                className="flex justify-between items-center py-4 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {t.subject}
                    {t.needsReply && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                        Needs Reply
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.company?.name} — {t.lastMessagePreview}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      t.status === "OPEN"
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {t.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(t.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}