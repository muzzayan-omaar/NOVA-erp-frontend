import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { UserPlus, Phone, X } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

export default function CustomersModule() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data);
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

    if (!form.name) {
      toast.error("Customer name is required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/customers", form);
      toast.success("Customer added");
      setForm({ name: "", phone: "", email: "" });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredit = customers.reduce((sum, c) => sum + Number(c.totalCredit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone /> Customers & Credit
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          {showForm ? <X size={20} /> : <UserPlus size={20} />}
          {showForm ? "Cancel" : "New Customer"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Total Customers</p>
          <p className="text-3xl font-bold">{customers.length}</p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Outstanding Credit</p>
          <p className="text-3xl font-bold text-red-600">
            UGX {totalCredit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <p className="text-slate-500">Active Store</p>
          <p className="text-xl font-bold">{user?.activeStore?.name || "Current Store"}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createCustomer} className="bg-white rounded-3xl shadow p-8 space-y-4">
          <h2 className="text-xl font-bold">New Customer</h2>

          <input
            placeholder="Full Name"
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
            placeholder="Email (optional)"
            type="email"
            className="w-full p-4 border rounded-2xl"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Customer"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">All Customers</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No customers yet</p>
          ) : (
            customers.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/admin/customers/${c.id}`)}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.phone}</p>
                </div>
                {c.totalCredit > 0 && (
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      UGX {Number(c.totalCredit).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">Owed</p>
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