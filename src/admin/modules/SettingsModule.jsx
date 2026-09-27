import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Settings as SettingsIcon,
  Building2,
  UserCog,
  Monitor,
  Save,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import FieldError, { inputErrorClass } from "../../components/ui/FieldError";

export default function SettingsModule() {
  const { user, logout } = useAuthStore();
  const isGM = user?.role === "GENERAL_MANAGER";

  const [tab, setTab] = useState(isGM ? "company" : "account");

  const TABS = [
    ...(isGM ? [{ key: "company", label: "Company", icon: Building2 }] : []),
    { key: "account", label: "My Account", icon: UserCog },
    { key: "sessions", label: "Active Sessions", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <SettingsIcon /> Settings
      </h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition ${
              tab === t.key ? "bg-nova-gradient text-white" : "bg-white text-slate-600 shadow-sm"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && isGM && <CompanyTab />}
      {tab === "account" && <AccountTab />}
      {tab === "sessions" && <SessionsTab />}
    </div>
  );
}

/* ---------- Company Profile + Business Preferences (GM only) ---------- */

function CompanyTab() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings/company");
      setCompany(res.data);
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        country: res.data.country || "",
        currency: res.data.currency || "UGX",
        vatRate: res.data.vatRate != null ? Math.round(res.data.vatRate * 100) : 18,
        lowStockThreshold: res.data.lowStockThreshold ?? 10,
      });
    } catch (err) {
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch("/settings/company", {
        ...form,
        vatRate: Number(form.vatRate) / 100,
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      toast.success("Company settings updated");
      fetchCompany();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <p className="text-center py-16 text-slate-500">Loading...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm p-8 space-y-4">
        <h2 className="text-lg font-bold">Company Profile</h2>

        <div>
          <label className="text-sm text-slate-500">Business Code</label>
          <input
            disabled
            className="w-full p-3 border rounded-2xl mt-1 bg-slate-50 text-slate-400"
            value={company.businessCode || ""}
          />
          <p className="text-xs text-slate-400 mt-1">Assigned at onboarding — contact support to change it.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">Company Name</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Contact Email</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Phone</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Country</label>
            <input
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8 space-y-4">
        <h2 className="text-lg font-bold">Business Preferences</h2>
        <p className="text-sm text-slate-500 -mt-2">
          These affect every new sale and stock alert going forward — existing records keep the rate
          that applied when they were created.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">VAT Rate (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.vatRate}
              onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Low Stock Threshold (units)</label>
            <input
              type="number"
              className="w-full p-3 border rounded-2xl mt-1"
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">
              Products at or below this stock level trigger a low-stock alert.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
      >
        <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

/* ---------- My Account (everyone) ---------- */

function AccountTab() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "New passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      setErrors({ newPassword: "Must be at least 8 characters" });
      return;
    }

    try {
      setSaving(true);
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update password";
      setErrors({ currentPassword: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-white rounded-3xl shadow-sm p-8">
        <h2 className="text-lg font-bold mb-4">Your Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Role</span>
            <span className="font-medium capitalize">{user?.role?.replace(/_/g, " ").toLowerCase()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="bg-white rounded-3xl shadow-sm p-8 space-y-4">
        <h2 className="text-lg font-bold">Change Password</h2>

        <div>
          <input
            type="password"
            placeholder="Current password"
            className={`w-full p-3 border rounded-2xl transition ${inputErrorClass(errors.currentPassword)}`}
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setErrors({}); }}
          />
          <FieldError message={errors.currentPassword} />
        </div>

        <div>
          <input
            type="password"
            placeholder="New password"
            className={`w-full p-3 border rounded-2xl transition ${inputErrorClass(errors.newPassword)}`}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
          />
          <FieldError message={errors.newPassword} />
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirm new password"
            className={`w-full p-3 border rounded-2xl transition ${inputErrorClass(errors.confirmPassword)}`}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
          />
          <FieldError message={errors.confirmPassword} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-nova-900 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

/* ---------- Active Sessions (everyone) ---------- */

function SessionsTab() {
  const { logout } = useAuthStore();
  const { confirm } = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings/sessions");
      setSessions(res.data);
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const describeDevice = (userAgent) => {
    if (!userAgent) return "Unknown device";
    if (/mobile/i.test(userAgent)) return "Mobile browser";
    if (/chrome/i.test(userAgent)) return "Chrome";
    if (/firefox/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent)) return "Safari";
    return "Browser session";
  };

  const revokeOne = async (session) => {
    const ok = await confirm({
      title: "Log out this session?",
      message: `This immediately ends that device's session. It'll need to log in again.`,
      confirmText: "Log Out Session",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.delete(`/settings/sessions/${session.id}`);
      toast.success("Session revoked");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to revoke session");
    }
  };

  const revokeAll = async () => {
    const ok = await confirm({
      title: "Log out of every device?",
      message: "This includes the device you're using right now — you'll be signed out immediately and need to log in again.",
      confirmText: "Log Out Everywhere",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.post("/settings/sessions/revoke-all");
      toast.success("Logged out everywhere");
      logout();
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-3xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Active Sessions</h2>
          {sessions.length > 0 && (
            <button
              onClick={revokeAll}
              className="flex items-center gap-2 text-sm font-medium text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50"
            >
              <ShieldAlert size={16} /> Log Out Everywhere
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Every device currently signed in to your account.
        </p>

        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No active sessions found</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex justify-between items-center border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Monitor size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{describeDevice(s.userAgent)}</p>
                    <p className="text-xs text-slate-400">
                      Signed in {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeOne(s)}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}