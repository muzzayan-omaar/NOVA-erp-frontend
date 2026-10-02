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
  Pencil,
  X,
  Hash,
  Mail,
  Phone,
  Globe,
  Percent,
  Package,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import FieldError, { inputErrorClass } from "../../components/ui/FieldError";

export default function SettingsModule() {
  const { user } = useAuthStore();
  const isGM = user?.role === "GENERAL_MANAGER";

  const [tab, setTab] = useState(isGM ? "company" : "account");

  const TABS = [
    ...(isGM ? [{ key: "company", label: "Company", icon: Building2 }] : []),
    { key: "account", label: "My account", icon: UserCog },
    { key: "sessions", label: "Sessions", icon: Monitor },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon /> Settings
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage your company, account security, and signed-in devices.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 p-1 bg-white rounded-2xl shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? "bg-nova-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
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

/* ---------- Company (GM) ---------- */

function CompanyTab() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

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
        vatRate:
          res.data.vatRate != null ? Math.round(res.data.vatRate * 100) : 18,
        lowStockThreshold: res.data.lowStockThreshold ?? 10,
      });
    } catch {
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch("/settings/company", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
      });
      toast.success("Company profile updated");
      setEditingProfile(false);
      fetchCompany();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch("/settings/company", {
        vatRate: Number(form.vatRate) / 100,
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      toast.success("Business preferences updated");
      setEditingPrefs(false);
      fetchCompany();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form || !company) {
    return <p className="text-center py-16 text-slate-500">Loading...</p>;
  }

  const vatDisplay =
    company.vatRate != null
      ? `${Math.round(company.vatRate * 100)}%`
      : "—";

  return (
    <div className="space-y-6">
      {/* Company identity header */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex">
        <div className="w-2 bg-nova-gradient" />
        <div className="flex-1 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-nova-900 truncate">
              {company.name || "Your company"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {company.businessCode && (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                  <Hash size={11} /> {company.businessCode}
                </span>
              )}
              {company.currency && (
                <span className="text-xs text-slate-400">
                  {company.currency}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile — facts by default */}
      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold">Company profile</h3>
          {!editingProfile ? (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-nova-blue hover:underline"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingProfile(false);
                setForm((f) => ({
                  ...f,
                  name: company.name || "",
                  email: company.email || "",
                  phone: company.phone || "",
                  country: company.country || "",
                }));
              }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>

        {!editingProfile ? (
          <dl className="px-6 py-4 divide-y">
            <FactRow icon={Building2} label="Company name" value={company.name} />
            <FactRow icon={Mail} label="Contact email" value={company.email} />
            <FactRow icon={Phone} label="Phone" value={company.phone} />
            <FactRow icon={Globe} label="Country" value={company.country} />
            <FactRow
              icon={Hash}
              label="Business code"
              value={company.businessCode}
              hint="Assigned at onboarding — contact support to change it."
            />
          </dl>
        ) : (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <LabeledInput
                label="Company name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <LabeledInput
                label="Contact email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <LabeledInput
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <LabeledInput
                label="Country"
                value={form.country}
                onChange={(v) => setForm({ ...form, country: v })}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-nova-gradient text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        )}
      </section>

      {/* Preferences — setting rows */}
      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold">Business preferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Apply to new sales and alerts. Past records keep their original
              values.
            </p>
          </div>
          {!editingPrefs ? (
            <button
              type="button"
              onClick={() => setEditingPrefs(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-nova-blue hover:underline flex-shrink-0"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingPrefs(false);
                setForm((f) => ({
                  ...f,
                  vatRate:
                    company.vatRate != null
                      ? Math.round(company.vatRate * 100)
                      : 18,
                  lowStockThreshold: company.lowStockThreshold ?? 10,
                }));
              }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>

        {!editingPrefs ? (
          <dl className="px-6 py-4 divide-y">
            <FactRow
              icon={Percent}
              label="VAT rate"
              value={vatDisplay}
              hint="Added on new quotations and sales"
            />
            <FactRow
              icon={Package}
              label="Low stock threshold"
              value={`${company.lowStockThreshold ?? 10} units`}
              hint="Products at or below this level trigger alerts"
            />
          </dl>
        ) : (
          <form onSubmit={handleSavePrefs} className="p-6 space-y-5">
            <SettingControl
              label="VAT rate (%)"
              description="Used on new quotes and sales going forward."
            >
              <input
                type="number"
                step="0.1"
                min="0"
                className="w-28 p-2.5 border rounded-xl text-sm text-right"
                value={form.vatRate}
                onChange={(e) =>
                  setForm({ ...form, vatRate: e.target.value })
                }
              />
            </SettingControl>
            <SettingControl
              label="Low stock threshold"
              description="Products at or below this quantity show as low stock."
            >
              <input
                type="number"
                min="0"
                className="w-28 p-2.5 border rounded-xl text-sm text-right"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: e.target.value })
                }
              />
            </SettingControl>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-nova-gradient text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save preferences"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function FactRow({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-sm mt-0.5 truncate">{value || "—"}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        className="w-full p-3 border rounded-2xl mt-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SettingControl({ label, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---------- My Account ---------- */

function AccountTab() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to update password";
      setErrors({ currentPassword: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 ">
      {/* Identity */}
      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold">Your account</h3>
        </div>
        <div className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-xl font-bold text-slate-400">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-nova-900 truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">
              {user?.role?.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold">Password</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Use a strong password you don’t reuse elsewhere.
            </p>
          </div>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="text-sm font-medium text-nova-blue hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {!showPasswordForm ? (
          <div className="px-6 py-5 text-sm text-slate-500">
            Password is set. Last change isn’t shown for security.
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <input
                type="password"
                placeholder="Current password"
                className={`w-full p-3 border rounded-2xl text-sm transition ${inputErrorClass(
                  errors.currentPassword
                )}`}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors({});
                }}
                autoComplete="current-password"
              />
              <FieldError message={errors.currentPassword} />
            </div>
            <div>
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                className={`w-full p-3 border rounded-2xl text-sm transition ${inputErrorClass(
                  errors.newPassword
                )}`}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({});
                }}
                autoComplete="new-password"
              />
              <FieldError message={errors.newPassword} />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm new password"
                className={`w-full p-3 border rounded-2xl text-sm transition ${inputErrorClass(
                  errors.confirmPassword
                )}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({});
                }}
                autoComplete="new-password"
              />
              <FieldError message={errors.confirmPassword} />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-nova-900 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrors({});
                }}
                className="px-5 py-2.5 rounded-2xl border text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

/* ---------- Sessions ---------- */

function SessionsTab() {
  const { logout } = useAuthStore();
  const { confirm } = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings/sessions");
      setSessions(res.data || []);
    } catch {
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
    if (/edg/i.test(userAgent)) return "Edge";
    if (/chrome/i.test(userAgent)) return "Chrome";
    if (/firefox/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent)) return "Safari";
    return "Browser session";
  };

  const revokeOne = async (session) => {
    const ok = await confirm({
      title: "Log out this session?",
      message:
        "This ends that device’s session immediately. It will need to log in again.",
      confirmText: "Log out session",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.delete(`/settings/sessions/${session.id}`);
      toast.success("Session revoked");
      fetchSessions();
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const revokeAll = async () => {
    const ok = await confirm({
      title: "Log out of every device?",
      message:
        "This includes this device — you’ll be signed out and need to log in again.",
      confirmText: "Log out everywhere",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.post("/settings/sessions/revoke-all");
      toast.success("Logged out everywhere");
      logout();
      window.location.href = "/login";
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Active sessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Devices currently signed in to your account.
            </p>
          </div>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={revokeAll}
              className="flex items-center gap-2 text-sm font-medium text-red-600 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50"
            >
              <ShieldAlert size={15} /> Log out everywhere
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-12">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No active sessions found
          </p>
        ) : (
          <div className="divide-y">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Monitor size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {describeDevice(s.userAgent)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Signed in{" "}
                      {new Date(s.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeOne(s)}
                  className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 flex-shrink-0"
                  title="Revoke session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}