import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Plus,
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  Power,
  Hash,
  X,
} from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-red-100 text-red-600",
};

export default function StoresModule() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    isHeadOffice: false,
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stores");
      setStores(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/stores", {
        name: form.name.trim(),
        location: form.location.trim() || null,
        phone: form.phone.trim() || null,
        isHeadOffice: form.isHeadOffice,
      });
      toast.success("Store created");
      setForm({ name: "", location: "", phone: "", isHeadOffice: false });
      setShowCreate(false);
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create store");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (store) => {
    try {
      await api.patch(`/stores/${store.id}/status`, {
        isActive: !store.isActive,
      });
      toast.success(
        `${store.name} ${store.isActive ? "disabled" : "enabled"}`
      );
      fetchStores();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update store");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return stores.filter((s) => {
      const status = s.isActive ? "ACTIVE" : "INACTIVE";
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!q) return true;

      const hay = [s.name, s.location, s.phone, s.storeCode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [stores, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 /> Stores
        </h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          {showCreate ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <Plus size={20} /> New Store
            </>
          )}
        </button>
      </div>

      {/* Create form (toggled) */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <h2 className="font-bold text-lg">Create new store</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              className="p-3 border rounded-2xl"
              placeholder="Store name *"
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
            <label className="flex items-center gap-3 p-3 border rounded-2xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isHeadOffice}
                onChange={(e) =>
                  setForm({ ...form, isHeadOffice: e.target.checked })
                }
                className="w-4 h-4 rounded accent-nova-blue"
              />
              <span className="text-sm font-medium text-slate-700">
                Head office
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create store"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 rounded-2xl border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, location, phone, store code…"
            className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          No stores match your filters
        </p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 text-xs font-semibold text-slate-400 border-b bg-slate-50">
            <div className="col-span-4">Store</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y">
            {filtered.map((store) => {
  const status = store.isActive ? "ACTIVE" : "INACTIVE";

  return (
    <div
      key={store.id}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/admin/stores/${store.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/admin/stores/${store.id}`);
        }
      }}
      className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 items-center hover:bg-slate-50 transition cursor-pointer"
    >
      {/* Store name + badges */}
      <div className="md:col-span-4 flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{store.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {store.isHeadOffice && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-nova-blue">
                Head Office
              </span>
            )}
            {store.storeCode && (
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5">
                <Hash size={10} />
                {store.storeCode}
              </span>
            )}
            {typeof store.staffCount === "number" && (
              <span className="text-[11px] text-slate-400">
                {store.staffCount} staff
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-1.5 truncate">
        <MapPin size={14} className="text-slate-400 flex-shrink-0" />
        <span className="truncate">{store.location || "—"}</span>
      </div>

      {/* Phone */}
      <div className="md:col-span-2 text-sm text-slate-600 flex items-center gap-1.5 truncate">
        <Phone size={14} className="text-slate-400 flex-shrink-0" />
        <span className="truncate">{store.phone || "—"}</span>
      </div>

      {/* Status */}
      <div className="md:col-span-2">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
          {store.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Toggle – stop propagation so it doesn’t open detail */}
      <div className="md:col-span-1 flex md:justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(store);
          }}
          title={store.isActive ? "Disable store" : "Enable store"}
          className={`p-2.5 rounded-xl transition ${
            store.isActive
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
        >
          <Power size={16} />
        </button>
      </div>
    </div>
  );
})}
          </div>
        </div>
      )}
    </div>
  );
}