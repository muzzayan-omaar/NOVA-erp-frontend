import { useEffect, useState } from "react";
import api from "../../services/api";
import { Plus, Trash2, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

export default function ExpensesModule() {
  const [expenses, setExpenses] = useState([]);
  const [mode, setMode] = useState("list");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "General",
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    // For now, we'll simulate. Later we'll add backend route
    // const res = await api.get("/expenses");
    // setExpenses(res.data);
    setExpenses([]); // Placeholder
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = () => {
    if (!form.description || !form.amount) {
      toast.error("Description and amount are required");
      return;
    }

    const newExpense = {
      id: Date.now(),
      ...form,
      amount: parseFloat(form.amount)
    };

    setExpenses([newExpense, ...expenses]);
    toast.success("Expense recorded");
    setForm({
      description: "",
      amount: "",
      category: "General",
      date: new Date().toISOString().split('T')[0]
    });
    setMode("list");
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    toast.success("Expense deleted");
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign /> Expenses & Accounting
        </h1>
        <button
          onClick={() => setMode("create")}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Record Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Total Expenses</h2>
          <p className="text-3xl font-bold text-red-600">UGX {totalExpenses.toLocaleString()}</p>
        </div>

        {mode === "create" && (
          <div className="bg-slate-50 p-6 rounded-2xl mb-6">
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
                <option value="General">General</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Salary">Salary</option>
                <option value="Transport">Transport</option>
              </select>
            </div>
            <button
              onClick={addExpense}
              className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold"
            >
              Record Expense
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-[500px] overflow-auto">
          {expenses.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No expenses recorded yet</p>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center p-4 border rounded-2xl">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-xs text-slate-500">{exp.category} • {exp.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-red-600">- UGX {exp.amount.toLocaleString()}</p>
                  <button onClick={() => deleteExpense(exp.id)} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}