import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  Pencil,
  MapPin,
  Phone,
  Hash,
  Users,
  Activity,
  Shield,
  Calendar,
  User,
} from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-red-100 text-red-600",
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

const ROLE_STYLES = {
  GENERAL_MANAGER: "bg-violet-100 text-violet-700",
  BRANCH_MANAGER: "bg-blue-100 text-nova-blue",
  CASHIER: "bg-slate-100 text-slate-600",
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

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stores/${id}`);
      setStore(res.data);
      setForm({
        name: res.data.name || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        isHeadOffice: !!res.data.isHeadOffice,
        isActive: !!res.data.isActive,
      });
    } catch {
      toast.error("Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/stores/${id}`, form);
      toast.success("Store updated");
      setEditing(false);
      fetchStore();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.patch(`/stores/${id}/status`, {
        isActive: !store.isActive,
      });
      toast.success(
        `${store.name} ${store.isActive ? "disabled" : "enabled"}`
      );
      fetchStore();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  if (loading || !store) {
    return <p className="text-center py-20">Loading...</p>;
  }

  const status = store.isActive ? "ACTIVE" : "INACTIVE";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/stores")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={18} /> Back to Stores
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
              store.isActive
                ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                : "text-red-600 border-red-200 bg-red-50"
            }`}
          >
            <Shield size={16} />
            {store.isActive ? "Disable store" : "Enable store"}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-nova-900 text-white hover:bg-nova-800"
          >
            <Pencil size={16} /> {editing ? "Close editor" : "Edit"}
          </button>
        </div>
      </div>

      {/* Identity header */}
      <div className="bg-white rounded-3xl shadow-nova overflow-hidden flex">
        <div className="w-2 bg-nova-gradient" />
        <div className="flex-1 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={32} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-nova-900 truncate">
              {store.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              {store.storeCode && (
                <span className="flex items-center gap-1 font-mono text-nova-blue font-semibold">
                  <Hash size={12} /> {store.storeCode}
                </span>
              )}
              {store.isHeadOffice && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-nova-blue">
                  Head Office
                </span>
              )}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}
              >
                {store.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                {store.location || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                {store.phone || "—"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Calendar size={12} /> Created {formatDate(store.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Users size={12} /> Staff
          </p>
          <p className="font-semibold mt-1 text-lg">{store.staffCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Activity size={12} /> Active now
          </p>
          <p className="font-semibold mt-1 text-lg">
            {store.activeStaffCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Sales (7d)</p>
          <p className="font-semibold mt-1 text-lg">{store.sales7d ?? 0}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Sales (30d)</p>
          <p className="font-semibold mt-1 text-lg">{store.sales30d ?? 0}</p>
        </div>
      </div>

      {/* Manager + quick facts */}
      <div className="bg-white rounded-3xl shadow-sm p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-3">Store manager</h2>
          {store.manager ? (
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${store.manager.id}`)}
              className="flex items-center gap-3 w-full text-left hover:bg-slate-50 rounded-2xl p-2 -m-2 transition"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {store.manager.employeeProfile?.photoUrl ? (
                  <img
                    src={store.manager.employeeProfile.photoUrl}
                    alt={store.manager.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{store.manager.name}</p>
                <p className="text-xs text-slate-500">
                  {store.manager.employeeProfile?.position ||
                    store.manager.role?.replace(/_/g, " ")}
                </p>
              </div>
            </button>
          ) : (
            <p className="text-sm text-slate-500">No branch manager assigned</p>
          )}
        </div>
        <div>
          <h2 className="font-bold mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Store code</dt>
              <dd className="font-mono font-medium">
                {store.storeCode || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Head office</dt>
              <dd className="font-medium">
                {store.isHeadOffice ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Created</dt>
              <dd className="font-medium">{formatDateTime(store.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Staff at this store */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Users size={18} /> Staff at this store
          </h2>
          <span className="text-xs text-slate-400">
            {store.staff?.length || 0} people
          </span>
        </div>

        {!store.staff || store.staff.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No staff assigned to this store yet
          </p>
        ) : (
          <div className="divide-y">
            {store.staff.map((u) => {
              const st = u.displayStatus || "OFF";
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  className="w-full text-left px-6 py-3.5 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.employeeProfile?.photoUrl ? (
                      <img
                        src={u.employeeProfile.photoUrl}
                        alt={u.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-slate-400 text-sm">
                        {u.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {u.employeeProfile?.position ||
                        u.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold hidden sm:inline ${
                      ROLE_STYLES[u.role] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role?.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      WORK_STATUS_STYLES[st] || WORK_STATUS_STYLES.OFF
                    }`}
                  >
                    {WORK_STATUS_LABELS[st] || st}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor */}
      {editing && form && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <h2 className="font-bold text-lg">Edit store</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-2xl"
              placeholder="Store name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select
              className="p-3 border rounded-2xl"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "active" })
              }
            >
              <option value="active">Store active</option>
              <option value="inactive">Store inactive</option>
            </select>
            <label className="flex items-center gap-3 p-3 border rounded-2xl cursor-pointer select-none sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isHeadOffice}
                onChange={(e) =>
                  setForm({ ...form, isHeadOffice: e.target.checked })
                }
                className="w-4 h-4 rounded accent-nova-blue"
              />
              <span className="text-sm font-medium text-slate-700">
                Mark as Head Office
              </span>
            </label>
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