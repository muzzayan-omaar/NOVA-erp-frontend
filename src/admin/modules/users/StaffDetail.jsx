import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useConfirm } from "../../../components/ui/ConfirmProvider";
import {
  ArrowLeft,
  User,
  Printer,
  Pencil,
  Trash2,
  Hash,
  Building2,
  Calendar,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import logo from "../../../assets/logo.png";

const ROLE_STYLES = {
  GENERAL_MANAGER: "bg-violet-100 text-violet-700",
  BRANCH_MANAGER: "bg-blue-100 text-nova-blue",
  CASHIER: "bg-slate-100 text-slate-600",
};

const WORK_STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  OFF: "bg-slate-100 text-slate-600",
  HOLIDAY: "bg-amber-100 text-amber-700",
  EMERGENCY_LEAVE: "bg-orange-100 text-orange-700",
  INACTIVE: "bg-red-100 text-red-600",
};

const WORK_STATUS_LABELS = {
  ACTIVE: "Active",
  OFF: "Off",
  HOLIDAY: "Holiday",
  EMERGENCY_LEAVE: "Emergency leave",
  INACTIVE: "Inactive",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [activity, setActivity] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${id}`);
      setStaff(res.data);

      const profile = res.data.employeeProfile || {};
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        role: res.data.role,
        isActive: res.data.isActive,
        workStatus: profile.workStatus || "ACTIVE",
        leaveDays: "", // only filled when granting leave
        position: profile.position || "",
        shift: profile.shift || "",
        educationLevel: profile.educationLevel || "",
        nationalIdType: profile.nationalIdType || "NIN",
        nationalIdNumber: profile.nationalIdNumber || "",
        defaultBasicSalary: profile.defaultBasicSalary ?? "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
      });
    } catch {
      toast.error("Failed to load staff member");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await api.get(`/users/${id}/activity`);
      setActivity(res.data);
    } catch {
      setActivity(null);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = { ...form };

      // Only send leaveDays when granting emergency leave or holiday
      if (
        form.workStatus === "EMERGENCY_LEAVE" ||
        form.workStatus === "HOLIDAY"
      ) {
        const days = Number(form.leaveDays);
        if (!Number.isFinite(days) || days < 1) {
          toast.error("Enter how many days of leave (minimum 1)");
          setSaving(false);
          return;
        }
        payload.leaveDays = days;
      } else {
        delete payload.leaveDays;
      }

      await api.patch(`/users/${id}`, payload);
      toast.success("Staff details updated");
      setEditing(false);
      fetchStaff();
      fetchActivity();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Remove ${staff.name}?`,
      message:
        "This permanently deletes their account and employee record. This cannot be undone.",
      confirmText: "Remove Staff Member",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("Staff member removed");
      navigate("/admin/users");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove staff member");
    }
  };

  const handlePrint = () => {
    const profile = staff.employeeProfile || {};
    const printWindow = window.open("", "_blank", "width=500,height=320");
    printWindow.document.write(`
      <html>
        <head>
          <title>${staff.name} — Employee Card</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #0F1B33; }
            .card { width: 400px; background: white; border-radius: 16px; overflow: hidden; display: flex; }
            .stripe { width: 8px; background: linear-gradient(180deg, #22D3EE, #1E40AF); }
            .content { display: flex; padding: 20px; gap: 16px; flex: 1; }
            .photo { width: 90px; height: 90px; border-radius: 12px; object-fit: cover; background: #e2e8f0; flex-shrink: 0; }
            .details h2 { margin: 0 0 4px; font-size: 18px; color: #0F1B33; }
            .details p { margin: 2px 0; font-size: 12px; color: #64748b; }
            .staffid { font-family: monospace; font-weight: bold; color: #1E40AF; font-size: 13px; margin-top: 8px; }
            .brand { font-size: 10px; color: #94a3b8; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="card">
            <div class="stripe"></div>
            <div class="content">
              ${
                profile.photoUrl
                  ? `<img src="${profile.photoUrl}" class="photo" />`
                  : `<div class="photo"></div>`
              }
              <div class="details">
                <h2>${staff.name}</h2>
                <p>${profile.position || staff.role.replace(/_/g, " ")}</p>
                <p>${staff.store?.name || ""}</p>
                <p class="staffid">ID: ${profile.staffId || "—"}</p>
                <p class="brand">NOVA ERP — Employee Identification</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading || !staff) {
    return <p className="text-center py-20">Loading...</p>;
  }

  const profile = staff.employeeProfile || {};
  // Prefer server-computed displayStatus (handles leave expiry + presence)
  const status =
    staff.displayStatus ||
    activity?.displayStatus ||
    (staff.isActive === false ? "INACTIVE" : "OFF");

  const statusAt =
    profile.workStatusUpdatedAt || staff.updatedAt || staff.createdAt;
  const joinedAt = profile.hireDate || staff.createdAt;
  const leaveUntil = profile.leaveUntil;
  const presence = staff.presence || activity?.presence || "offline";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={18} /> Back to Staff Directory
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-slate-600 hover:bg-slate-50"
          >
            <Printer size={16} /> Print card
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-nova-900 text-white hover:bg-nova-800"
          >
            <Pencil size={16} /> {editing ? "Close editor" : "Edit"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 text-red-600 border border-red-200"
          >
            <Trash2 size={16} /> Remove
          </button>
        </div>
      </div>

      {/* Identity header */}
      <div className="bg-white rounded-3xl shadow-nova overflow-hidden flex">
        <div className="w-2 bg-nova-gradient" />
        <div className="flex-1 p-6 flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={staff.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-nova-900 truncate">
              {staff.name}
            </h1>
            <p className="text-slate-500 text-sm">
              {profile.position || staff.role.replace(/_/g, " ")}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {staff.store?.name || "—"}
              </span>
              <span className="flex items-center gap-1 font-mono text-nova-blue font-semibold">
                <Hash size={12} /> {profile.staffId || "—"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  ROLE_STYLES[staff.role] || "bg-slate-100 text-slate-600"
                }`}
              >
                {staff.role?.replace(/_/g, " ")}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  WORK_STATUS_STYLES[status] || WORK_STATUS_STYLES.OFF
                }`}
              >
                {WORK_STATUS_LABELS[status] || status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Clock size={12} /> Status since {formatDateTime(statusAt)}
              {leaveUntil &&
                (status === "EMERGENCY_LEAVE" || status === "HOLIDAY") && (
                  <span className="ml-2">
                    · until {formatDate(leaveUntil)}
                  </span>
                )}
            </p>
          </div>
          <img
            src={logo}
            alt="Nova ERP"
            className="w-10 h-10 opacity-40 hidden sm:block"
          />
        </div>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar size={12} /> Joined
          </p>
          <p className="font-semibold mt-1">{formatDate(joinedAt)}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Shield size={12} /> Account
          </p>
          <p className="font-semibold mt-1">
            {staff.isActive ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Activity size={12} /> Presence
          </p>
          <p className="font-semibold mt-1 capitalize">{presence}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {staff.lastSeenAt || activity?.lastSeenAt
              ? `Last seen ${formatDateTime(
                  staff.lastSeenAt || activity.lastSeenAt
                )}`
              : "No live presence yet"}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Shift</p>
          <p className="font-semibold mt-1">{profile.shift || "—"}</p>
        </div>
      </div>

      {/* Profile facts (read-only) */}
      <div className="bg-white rounded-3xl shadow-sm p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-3">Employment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Position</dt>
              <dd className="font-medium text-right">
                {profile.position || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Education</dt>
              <dd className="font-medium text-right">
                {profile.educationLevel || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Basic salary</dt>
              <dd className="font-medium text-right">
                {profile.defaultBasicSalary != null &&
                profile.defaultBasicSalary !== ""
                  ? Number(profile.defaultBasicSalary).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="font-bold mb-3">Identity & emergency</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">ID type</dt>
              <dd className="font-medium text-right">
                {profile.nationalIdType || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">ID number</dt>
              <dd className="font-medium text-right font-mono">
                {profile.nationalIdNumber || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Emergency</dt>
              <dd className="font-medium text-right">
                {profile.emergencyContactName || "—"}
                {profile.emergencyContactPhone
                  ? ` · ${profile.emergencyContactPhone}`
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-right">{staff.email || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Behaviour / activity */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold flex items-center gap-2">
            <Activity size={18} /> Activity & behaviour
          </h2>
          <span className="text-xs text-slate-400">
            Weekly / monthly snapshot
          </span>
        </div>

        {activity ? (
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border p-4">
              <p className="text-slate-400 text-xs">Sales (7d)</p>
              <p className="text-lg font-bold mt-1">
                {activity.sales7d ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-slate-400 text-xs">Sales (30d)</p>
              <p className="text-lg font-bold mt-1">
                {activity.sales30d ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-slate-400 text-xs">Failed logins (7d)</p>
              <p className="text-lg font-bold mt-1">
                {activity.failedLogins7d ?? "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Behaviour metrics will show here once activity data is available.
          </p>
        )}
      </div>

      {/* Editor */}
      {editing && form && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <h2 className="font-bold text-lg">Edit staff</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-2xl"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className="p-3 border rounded-2xl"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="CASHIER">Cashier</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="GENERAL_MANAGER">General Manager</option>
            </select>
            <select
              className="p-3 border rounded-2xl"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "active" })
              }
            >
              <option value="active">Account enabled</option>
              <option value="inactive">Account disabled</option>
            </select>

            {/* Work status + leave days */}
            <select
              className="p-3 border rounded-2xl"
              value={form.workStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  workStatus: e.target.value,
                  leaveDays:
                    e.target.value === "EMERGENCY_LEAVE" ||
                    e.target.value === "HOLIDAY"
                      ? form.leaveDays || "1"
                      : "",
                })
              }
            >
              <option value="ACTIVE">At work (Active)</option>
              <option value="OFF">Off</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="EMERGENCY_LEAVE">Emergency leave</option>
            </select>

            {(form.workStatus === "EMERGENCY_LEAVE" ||
              form.workStatus === "HOLIDAY") && (
              <input
                type="number"
                min="1"
                className="p-3 border rounded-2xl"
                placeholder="Number of days"
                value={form.leaveDays}
                onChange={(e) =>
                  setForm({ ...form, leaveDays: e.target.value })
                }
              />
            )}

            <input
              className="p-3 border rounded-2xl"
              placeholder="Position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
            <select
              className="p-3 border rounded-2xl"
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
            >
              <option value="">Select shift</option>
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="Rotating">Rotating</option>
            </select>
            <input
              type="number"
              className="p-3 border rounded-2xl"
              placeholder="Default basic salary"
              value={form.defaultBasicSalary}
              onChange={(e) =>
                setForm({ ...form, defaultBasicSalary: e.target.value })
              }
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Emergency contact name"
              value={form.emergencyContactName}
              onChange={(e) =>
                setForm({ ...form, emergencyContactName: e.target.value })
              }
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Emergency contact phone"
              value={form.emergencyContactPhone}
              onChange={(e) =>
                setForm({ ...form, emergencyContactPhone: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-6 py-3 rounded-2xl border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}