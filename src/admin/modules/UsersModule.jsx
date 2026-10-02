import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  UserPlus,
  Users,
  Hash,
  Building2,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

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

function formatWhen(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

export default function UsersModule() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get("/stores/options");
      setStores(res.data);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      // Prefer the server-computed displayStatus (presence + leave)
      const status = u.displayStatus || (u.isActive === false ? "INACTIVE" : "OFF");

      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (storeFilter !== "ALL" && u.storeId !== storeFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!q) return true;

      const hay = [
        u.name,
        u.email,
        u.role,
        u.store?.name,
        u.employeeProfile?.staffId,
        u.employeeProfile?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [users, search, roleFilter, storeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users /> Staff Directory
        </h1>
        <button
          onClick={() => navigate("/admin/users/new")}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          <UserPlus size={20} /> New Staff
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, staff ID, store, role…"
            className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All roles</option>
            <option value="GENERAL_MANAGER">General Manager</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="CASHIER">Cashier</option>
          </select>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active (online)</option>
            <option value="OFF">Off</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="EMERGENCY_LEAVE">Emergency leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">No staff match your filters</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 text-xs font-semibold text-slate-400 border-b bg-slate-50">
            <div className="col-span-4">Staff</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Store</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Staff ID</div>
          </div>

          <div className="divide-y">
            {filtered.map((u) => {
              const status =
                u.displayStatus || (u.isActive === false ? "INACTIVE" : "OFF");
              const statusAt =
                formatWhen(u.employeeProfile?.workStatusUpdatedAt) ||
                formatWhen(u.lastSeenAt) ||
                formatWhen(u.updatedAt);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  className="w-full text-left px-6 py-4 hover:bg-slate-50 transition grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 items-center"
                >
                  <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {u.employeeProfile?.photoUrl ? (
                        <img
                          src={u.employeeProfile.photoUrl}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-slate-400">
                          {u.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {u.employeeProfile?.position || u.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ROLE_STYLES[u.role] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="md:col-span-2 text-sm text-slate-600 flex items-center gap-1.5 truncate">
                    <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{u.store?.name || "—"}</span>
                  </div>

                  <div className="md:col-span-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        WORK_STATUS_STYLES[status] || WORK_STATUS_STYLES.OFF
                      }`}
                    >
                      {WORK_STATUS_LABELS[status] || status}
                    </span>
                    {statusAt && (
                      <p className="text-[10px] text-slate-400 mt-1">{statusAt}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 text-sm font-mono text-slate-500 flex items-center gap-1">
                    <Hash size={12} />
                    {u.employeeProfile?.staffId || "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}