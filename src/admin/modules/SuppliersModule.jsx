import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Plus, Truck, X } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

export default function SuppliersModule() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.activeStoreId || user?.storeId) {
      fetchSuppliers();
    }
  }, [user?.activeStoreId, user?.storeId]);

  const createSupplier = async (e) => {
    e.preventDefault();

    if (!form.name) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/suppliers", form);
      toast.success("Supplier added");
      setForm({ name: "", phone: "", email: "", address: "" });
      setShowForm(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOwed = suppliers.reduce((sum, s) => sum + Number(s.totalOwed || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Truck /> Suppliers & Procurement
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "New Supplier"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Total Suppliers</p>
          <p className="text-3xl font-bold">{suppliers.length}</p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Outstanding Debt</p>
          <p className="text-3xl font-bold text-red-600">
            UGX {totalOwed.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Store</p>
          <p className="text-xl font-bold">{user?.activeStore?.name || "Current Store"}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createSupplier} className="bg-white rounded-3xl shadow p-8 space-y-4">
          <h2 className="text-xl font-bold">New Supplier</h2>

          <input
            placeholder="Supplier Name"
            className="w-full p-4 border rounded-2xl"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Phone Number"
            className="w-full p-4 border rounded-2xl"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Email (needed to send orders by email)"
            type="email"
            className="w-full p-4 border rounded-2xl"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <textarea
            placeholder="Address"
            className="w-full p-4 border rounded-2xl h-24"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Supplier"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">All Suppliers</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-500 py-10 text-center">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No suppliers yet</p>
          ) : (
            suppliers.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/admin/suppliers/${s.id}`)}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.phone}</div>
                </div>
                {s.totalOwed > 0 && (
                  <div className="text-red-600 font-medium">
                    Owed: UGX {Number(s.totalOwed || 0).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}