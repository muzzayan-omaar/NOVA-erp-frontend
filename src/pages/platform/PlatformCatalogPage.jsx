import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { Layers, Plus, Save, Power } from "lucide-react";

const EXTRA_FEATURES = [
  "stores", "users", "payroll", "reports", "expenses",
  "audit", "suppliers", "payments"
];

export default function PlatformCatalogPage() {
  const [tab, setTab] = useState("bundles");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Layers /> Catalog
      </h1>

      <div className="flex gap-2 bg-white rounded-2xl p-1 shadow w-fit">
        {["bundles", "packages", "billing-cycles"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t === "bundles" ? "Bundles" : t === "packages" ? "Packages" : "Billing Cycles"}
          </button>
        ))}
      </div>

      {tab === "bundles" && <BundlesTab />}
      {tab === "packages" && <PackagesTab />}
      {tab === "billing-cycles" && <BillingCyclesTab />}
    </div>
  );
}

/* ---------------- Bundles ---------------- */

function BundlesTab() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", price: "", featureKeys: [] });

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get("/platform/bundles");
      setBundles(res.data);
    } catch (err) {
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBundles(); }, []);

  const toggleFeature = (key) => {
    setForm((f) => ({
      ...f,
      featureKeys: f.featureKeys.includes(key)
        ? f.featureKeys.filter((k) => k !== key)
        : [...f.featureKeys, key],
    }));
  };

  const createBundle = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.price || form.featureKeys.length === 0) {
      toast.error("Code, name, price, and at least one feature are required");
      return;
    }
    try {
      setSaving(true);
      await platformApi.post("/platform/bundles", { ...form, price: Number(form.price) });
      toast.success("Bundle created");
      setForm({ code: "", name: "", description: "", price: "", featureKeys: [] });
      setShowForm(false);
      fetchBundles();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create bundle");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (bundle) => {
    if (!window.confirm(`${bundle.isActive ? "Retire" : "Reactivate"} "${bundle.name}"?`)) return;
    try {
      await platformApi.patch(`/platform/bundles/${bundle.id}/status`, { isActive: !bundle.isActive });
      fetchBundles();
    } catch (err) {
      toast.error("Failed to update bundle");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
      >
        <Plus size={18} /> New Bundle
      </button>

      {showForm && (
        <form onSubmit={createBundle} className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Code (e.g. TEAM_PAYROLL)"
              className="p-3 border rounded-2xl"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <input
              placeholder="Name"
              className="p-3 border rounded-2xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (UGX/month)"
              className="p-3 border rounded-2xl"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <input
            placeholder="Description"
            className="w-full p-3 border rounded-2xl"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Features included</p>
            <div className="flex flex-wrap gap-2">
              {EXTRA_FEATURES.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className={`px-3 py-2 rounded-xl text-sm ${
                    form.featureKeys.includes(key)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Bundle"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-10">Loading...</p>
        ) : (
          <div className="divide-y">
            {bundles.map((b) => (
              <div key={b.id} className="py-4 px-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{b.code}</span>
                      {!b.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-semibold">RETIRED</span>
                      )}
                    </div>
                    <p className="font-semibold mt-2">{b.name}</p>
                    <p className="text-sm text-slate-500">{b.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.featureKeys.map((k) => (
                        <span key={k} className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">UGX {Number(b.price).toLocaleString()}/mo</p>
                    <button
                      onClick={() => toggleActive(b)}
                      className={`mt-2 flex items-center gap-1 text-xs px-3 py-2 rounded-xl font-medium ${
                        b.isActive
                          ? "text-red-600 border border-red-200 hover:bg-red-50"
                          : "text-green-600 border border-green-200 hover:bg-green-50"
                      }`}
                    >
                      <Power size={13} /> {b.isActive ? "Retire" : "Reactivate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Packages ---------------- */

function PackagesTab() {
  const [packages, setPackages] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", description: "", price: "", maxStores: "1", maxUsers: "3", bundleIds: [],
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pkgRes, bundleRes] = await Promise.all([
        platformApi.get("/platform/packages"),
        platformApi.get("/platform/bundles"),
      ]);
      setPackages(pkgRes.data);
      setBundles(bundleRes.data.filter((b) => b.isActive));
    } catch (err) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleBundle = (id) => {
    setForm((f) => ({
      ...f,
      bundleIds: f.bundleIds.includes(id) ? f.bundleIds.filter((b) => b !== id) : [...f.bundleIds, id],
    }));
  };

  const createPackage = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.price) {
      toast.error("Code, name, and price are required");
      return;
    }
    try {
      setSaving(true);
      await platformApi.post("/platform/packages", form);
      toast.success("Package created");
      setForm({ code: "", name: "", description: "", price: "", maxStores: "1", maxUsers: "3", bundleIds: [] });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create package");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg) => {
    if (!window.confirm(`${pkg.isActive ? "Retire" : "Reactivate"} "${pkg.name}"?`)) return;
    try {
      await platformApi.patch(`/platform/packages/${pkg.id}/status`, { isActive: !pkg.isActive });
      fetchAll();
    } catch (err) {
      toast.error("Failed to update package");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
      >
        <Plus size={18} /> New Package
      </button>

      {showForm && (
        <form onSubmit={createPackage} className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Code (e.g. GROWTH)"
              className="p-3 border rounded-2xl"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <input
              placeholder="Name"
              className="p-3 border rounded-2xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <input
            placeholder="Description"
            className="w-full p-3 border rounded-2xl"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Price (UGX/month)"
              className="p-3 border rounded-2xl"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max Stores"
              className="p-3 border rounded-2xl"
              value={form.maxStores}
              onChange={(e) => setForm({ ...form, maxStores: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max Users"
              className="p-3 border rounded-2xl"
              value={form.maxUsers}
              onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Included Bundles</p>
            <div className="flex flex-wrap gap-2">
              {bundles.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => toggleBundle(b.id)}
                  className={`px-3 py-2 rounded-xl text-sm ${
                    form.bundleIds.includes(b.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Package"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-10">Loading...</p>
        ) : (
          <div className="divide-y">
            {packages.map((p) => (
              <div key={p.id} className="py-4 px-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{p.code}</span>
                      {!p.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-semibold">RETIRED</span>
                      )}
                    </div>
                    <p className="font-semibold mt-2">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.maxStores} store(s) · {p.maxUsers} user(s)
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.bundles?.map((pb) => (
                        <span key={pb.bundle.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                          {pb.bundle.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">UGX {Number(p.price).toLocaleString()}/mo</p>
                    <button
                      onClick={() => toggleActive(p)}
                      className={`mt-2 flex items-center gap-1 text-xs px-3 py-2 rounded-xl font-medium ${
                        p.isActive
                          ? "text-red-600 border border-red-200 hover:bg-red-50"
                          : "text-green-600 border border-green-200 hover:bg-green-50"
                      }`}
                    >
                      <Power size={13} /> {p.isActive ? "Retire" : "Reactivate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Billing Cycles ---------------- */

function BillingCyclesTab() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", payMonths: "", bonusMonths: "0" });

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get("/platform/billing-cycles");
      setCycles(res.data);
    } catch (err) {
      toast.error("Failed to load billing cycles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycles(); }, []);

  const createCycle = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.payMonths) {
      toast.error("Code, name, and pay months are required");
      return;
    }
    try {
      setSaving(true);
      await platformApi.post("/platform/billing-cycles", form);
      toast.success("Billing cycle created");
      setForm({ code: "", name: "", payMonths: "", bonusMonths: "0" });
      setShowForm(false);
      fetchCycles();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create billing cycle");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cycle) => {
    try {
      await platformApi.patch(`/platform/billing-cycles/${cycle.id}/status`, { isActive: !cycle.isActive });
      fetchCycles();
    } catch (err) {
      toast.error("Failed to update billing cycle");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
      >
        <Plus size={18} /> New Billing Cycle
      </button>

      {showForm && (
        <form onSubmit={createCycle} className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Code (e.g. QUARTERLY)"
              className="p-3 border rounded-2xl"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <input
              placeholder="Name"
              className="p-3 border rounded-2xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">Months to pay for</label>
              <input
                type="number"
                className="w-full p-3 border rounded-2xl mt-1"
                value={form.payMonths}
                onChange={(e) => setForm({ ...form, payMonths: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Bonus months free</label>
              <input
                type="number"
                className="w-full p-3 border rounded-2xl mt-1"
                value={form.bonusMonths}
                onChange={(e) => setForm({ ...form, bonusMonths: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Billing Cycle"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-10">Loading...</p>
        ) : (
          <div className="divide-y">
            {cycles.map((c) => (
              <div key={c.id} className="flex justify-between items-center py-4 px-2">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    Pay {c.payMonths} month(s), get {c.bonusMonths} free
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(c)}
                  className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl font-medium ${
                    c.isActive
                      ? "text-red-600 border border-red-200 hover:bg-red-50"
                      : "text-green-600 border border-green-200 hover:bg-green-50"
                  }`}
                >
                  <Power size={13} /> {c.isActive ? "Retire" : "Reactivate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}