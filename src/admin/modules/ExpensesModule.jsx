import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";
import { Plus, Trash2, DollarSign, X } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["General", "Rent", "Utilities", "Salary", "Transport", "Supplies", "Other"];

export default function ExpensesModule() {
  const { user } = useAuthStore();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "General",
  });

  const isGM = user?.role === "GENERAL_MANAGER";

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses");
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.activeStoreId || user?.storeId) {
      fetchExpenses();
    }
  }, [user?.activeStoreId, user?.storeId]);

  const addExpense = async () => {
    if (!form.description || !form.amount) {
      toast.error("Description and amount are required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/expenses", {
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
      });

      toast.success("Expense recorded");
      setForm({ description: "", amount: "", category: "General" });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete expense");
    }
  };

  const filteredExpenses =
    categoryFilter === "All"
      ? expenses
      : expenses.filter((exp) => exp.category === categoryFilter);

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign /> Expenses & Accounting
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Record Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Total Expenses</h2>
            <p className="text-sm text-slate-500">
              {categoryFilter === "All" ? "All categories" : categoryFilter}
            </p>
          </div>
          <p className="text-3xl font-bold text-red-600">
            UGX {totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="mb-6">
          <select
            className="p-3 border rounded-2xl"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className="bg-slate-50 p-6 rounded-2xl mb-6 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <input
              placeholder="Expense Description"
              className="w-full p-4 border rounded-2xl mb-4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Amount"
                className="p-4 border rounded-2xl"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <select
                className="p-4 border rounded-2xl"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addExpense}
              disabled={submitting}
              className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Record Expense"}
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-[500px] overflow-auto">
          {loading ? (
            <p className="text-slate-500 py-10 text-center">Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No expenses recorded yet</p>
          ) : (
            filteredExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-4 border rounded-2xl">
                <div>
                  <p className="font-medium">{exp.description || exp.category}</p>
                  <p className="text-xs text-slate-500">
                    {exp.category} • {new Date(exp.createdAt).toLocaleDateString()} •{" "}
                    {exp.createdBy?.name || "Unknown"}
                    {exp.store?.name ? ` • ${exp.store.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-red-600">
                    - UGX {Number(exp.amount).toLocaleString()}
                  </p>
                  {isGM && (
                    <button onClick={() => deleteExpense(exp.id)} className="text-red-500">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}