import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { Megaphone } from "lucide-react";

export default function PlatformBroadcastPage() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", priority: "MEDIUM", companyId: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    platformApi.get("/platform/companies").then((res) => setCompanies(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.message) {
      toast.error("Title and message are required");
      return;
    }

    const confirmMsg = form.companyId
      ? "Send this to the selected company's GM only?"
      : "Send this to EVERY company's GM on the platform?";
    if (!window.confirm(confirmMsg)) return;

    try {
      setSending(true);
      const res = await platformApi.post("/platform/broadcast", {
        ...form,
        companyId: form.companyId || null,
      });
      toast.success(`Sent to ${res.data.recipientCount} recipient(s)`);
      setForm({ title: "", message: "", priority: "MEDIUM", companyId: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Megaphone /> Broadcast Announcement
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Send To</label>
          <select
            className="w-full p-3 border rounded-2xl mt-1"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            className="w-full p-3 border rounded-2xl mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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

        <div>
          <label className="text-sm font-medium text-slate-700">Priority</label>
          <select
            className="w-full p-3 border rounded-2xl mt-1"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Broadcast"}
        </button>
      </form>
    </div>
  );
}