import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  UserPlus,
  Users,
  Phone,
  Mail,
  X,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

const emptyForm = { name: "", phone: "", email: "" };

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `UGX ${Number(n).toLocaleString()}`;
}

export default function CustomersModule() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [creditFilter, setCreditFilter] = useState("ALL"); // ALL | OWED | CLEAR

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.activeStoreId || user?.storeId) {
      fetchCustomers();
    }
  }, [user?.activeStoreId, user?.storeId]);

  const createCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/customers", {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      });
      toast.success("Customer added");
      setForm(emptyForm);
      setShowForm(false);
      await fetchCustomers();
      if (res.data?.id) {
        navigate(`/admin/customers/${res.data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredit = customers.reduce(
    (sum, c) => sum + Number(c.totalCredit || 0),
    0
  );
  const withCredit = customers.filter((c) => Number(c.totalCredit) > 0).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter((c) => {
      const credit = Number(c.totalCredit || 0);
      if (creditFilter === "OWED" && credit <= 0) return false;
      if (creditFilter === "CLEAR" && credit > 0) return false;

      if (!q) return true;
      const hay = [c.name, c.phone, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search, creditFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users /> Customers
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          {showForm ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <UserPlus size={20} /> New Customer
            </>
          )}
        </button>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Total customers</p>
          <p className="font-semibold mt-1 text-lg">{customers.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">With credit</p>
          <p className="font-semibold mt-1 text-lg">{withCredit}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Outstanding credit</p>
          <p
            className={`font-semibold mt-1 text-lg ${
              totalCredit > 0 ? "text-red-600" : ""
            }`}
          >
            {formatMoney(totalCredit)}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-slate-400">Store</p>
          <p className="font-semibold mt-1 text-lg truncate">
            {user?.activeStore?.name || "Current store"}
          </p>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={createCustomer}
          className="bg-white rounded-3xl shadow-sm p-6 space-y-5 border border-nova-blue/20"
        >
          <h2 className="font-bold text-lg">New customer</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-2xl sm:col-span-2"
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="p-3 border rounded-2xl"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="email"
              className="p-3 border rounded-2xl"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add customer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
            placeholder="Search name, phone, email…"
            className="w-full pl-10 pr-4 py-2.5 border rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm"
          >
            <option value="ALL">All balances</option>
            <option value="OWED">Has outstanding credit</option>
            <option value="CLEAR">No credit</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          No customers match your filters
        </p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 text-xs font-semibold text-slate-400 border-b bg-slate-50">
            <div className="col-span-4">Customer</div>
            <div className="col-span-3">Phone</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>

          <div className="divide-y">
            {filtered.map((c) => {
              const credit = Number(c.totalCredit || 0);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                  className="w-full text-left px-6 py-4 hover:bg-slate-50 transition grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                >
                  <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-slate-400">
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <p className="font-semibold truncate">{c.name}</p>
                  </div>

                  <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-1.5 truncate">
                    <Phone size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{c.phone || "—"}</span>
                  </div>

                  <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-1.5 truncate">
                    <Mail size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{c.email || "—"}</span>
                  </div>

                  <div className="md:col-span-2 text-right">
                    {credit > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        {formatMoney(credit)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Clear
                      </span>
                    )}
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