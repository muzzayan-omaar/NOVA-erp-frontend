import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { LifeBuoy, Plus, MessageCircle, X } from "lucide-react";

export default function SupportModule() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/support/threads");
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

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.subject || !form.message) {
      toast.error("Subject and message are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/support/threads", form);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LifeBuoy /> Support
          </h1>
          <p className="text-slate-500">Message the Nova team directly — no middlemen.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "New Message"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              placeholder="e.g. Question about my subscription"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea
              rows={4}
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : threads.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
            No conversations yet — send us a message anytime.
          </div>
        ) : (
          <div className="divide-y">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/admin/support/${t.id}`)}
                className="flex justify-between items-center py-4 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {t.subject}
                    {t.hasNewReply && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </p>
                  <p className="text-sm text-slate-500 truncate max-w-md">
                    {t.lastMessagePreview}
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