import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { Tag, Plus, Save, Power } from "lucide-react";

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newPlan, setNewPlan] = useState({ code: "", name: "", price: "", durationDays: "30" });
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get("/platform/plans");
      setPlans(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const startEdit = (plan) => {
    setEditing({
      ...editing,
      [plan.id]: { name: plan.name, price: plan.price, durationDays: plan.durationDays },
    });
  };

  const saveEdit = async (id) => {
    try {
      setSaving(true);
      await platformApi.patch(`/platform/plans/${id}`, editing[id]);
      toast.success("Plan updated");
      const next = { ...editing };
      delete next[id];
      setEditing(next);
      fetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    const confirmMsg = plan.isActive
      ? `Retire "${plan.name}"? Companies will no longer be able to choose it when renewing.`
      : `Reactivate "${plan.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await platformApi.patch(`/platform/plans/${plan.id}/status`, { isActive: !plan.isActive });
      toast.success(plan.isActive ? "Plan retired" : "Plan reactivated");
      fetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update plan status");
    }
  };

  const createPlan = async (e) => {
    e.preventDefault();

    if (!newPlan.code || !newPlan.name || !newPlan.price) {
      toast.error("Code, name, and price are required");
      return;
    }

    try {
      setSaving(true);
      await platformApi.post("/platform/plans", {
        ...newPlan,
        price: Number(newPlan.price),
        durationDays: Number(newPlan.durationDays),
      });
      toast.success("Plan created");
      setNewPlan({ code: "", name: "", price: "", durationDays: "30" });
      setShowForm(false);
      fetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Tag /> Plans & Pricing
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
        >
          <Plus size={18} /> New Plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={createPlan} className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Code (permanent, e.g. GOLD)
              </label>
              <input
                className="w-full p-3 border rounded-2xl mt-1"
                value={newPlan.code}
                onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Display Name</label>
              <input
                className="w-full p-3 border rounded-2xl mt-1"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Price (UGX)</label>
              <input
                type="number"
                className="w-full p-3 border rounded-2xl mt-1"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Duration (days)</label>
              <input
                type="number"
                className="w-full p-3 border rounded-2xl mt-1"
                value={newPlan.durationDays}
                onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Plan"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : (
          <div className="divide-y">
            {plans.map((plan) => {
              const isEditing = editing[plan.id];
              return (
                <div key={plan.id} className="py-4 px-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        {plan.code}
                      </span>
                      {!plan.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-semibold">
                          RETIRED
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleActive(plan)}
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium ${
                        plan.isActive
                          ? "text-red-600 border border-red-200 hover:bg-red-50"
                          : "text-green-600 border border-green-200 hover:bg-green-50"
                      }`}
                    >
                      <Power size={14} />
                      {plan.isActive ? "Retire" : "Reactivate"}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <input
                        className="p-2 border rounded-xl text-sm"
                        value={isEditing.name}
                        onChange={(e) =>
                          setEditing({ ...editing, [plan.id]: { ...isEditing, name: e.target.value } })
                        }
                      />
                      <input
                        type="number"
                        className="p-2 border rounded-xl text-sm"
                        value={isEditing.price}
                        onChange={(e) =>
                          setEditing({ ...editing, [plan.id]: { ...isEditing, price: e.target.value } })
                        }
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="p-2 border rounded-xl text-sm w-full"
                          value={isEditing.durationDays}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              [plan.id]: { ...isEditing, durationDays: e.target.value },
                            })
                          }
                        />
                        <button
                          onClick={() => saveEdit(plan.id)}
                          disabled={saving}
                          className="bg-green-600 text-white p-2 rounded-xl"
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEdit(plan)}
                      className="flex justify-between items-center mt-2 cursor-pointer hover:bg-slate-50 rounded-xl p-2 -mx-2"
                    >
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-slate-500">
                        UGX {Number(plan.price).toLocaleString()} / {plan.durationDays} days
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}