import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { X, Layers } from "lucide-react";

export default function AddBundleModal({ company, onClose, onSuccess }) {
  const [allBundles, setAllBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [method, setMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    platformApi
      .get("/platform/bundles")
      .then((res) => setAllBundles(res.data.filter((b) => b.isActive)))
      .catch(() => toast.error("Failed to load bundles"))
      .finally(() => setLoading(false));
  }, []);

  const packageBundleCodes = company.subscription?.package?.bundles.map((pb) => pb.bundle.code) || [];
  const ownedExtraCodes = company.bundles?.map((cb) => cb.bundle.code) || [];
  const ownedCodes = [...packageBundleCodes, ...ownedExtraCodes];

  const availableBundles = allBundles.filter((b) => !ownedCodes.includes(b.code));

  const toggle = (code) => {
    setSelected((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  };

  const total = allBundles
    .filter((b) => selected.includes(b.code))
    .reduce((sum, b) => sum + b.price, 0);

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one bundle");
      return;
    }

    try {
      setSubmitting(true);
      const res = await platformApi.post(`/platform/companies/${company.id}/bundles`, {
        bundleCodes: selected,
        method,
        notes,
      });
      toast.success(`Added — collected UGX ${res.data.amount.toLocaleString()}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add bundles");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers /> Add Bundles — {company.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={22} />
          </button>
        </div>

        {ownedCodes.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-green-700 mb-2">Already has</p>
            <div className="flex flex-wrap gap-2">
              {allBundles
                .filter((b) => ownedCodes.includes(b.code))
                .map((b) => (
                  <span key={b.code} className="text-xs bg-white px-3 py-2 rounded-xl border">{b.name}</span>
                ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center py-10">Loading...</p>
        ) : availableBundles.length === 0 ? (
          <p className="text-center py-10 text-slate-500">This company already has every available bundle.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {availableBundles.map((b) => (
              <button
                key={b.code}
                onClick={() => toggle(b.code)}
                className={`w-full text-left p-4 rounded-2xl border transition flex justify-between items-center ${
                  selected.includes(b.code) ? "border-blue-600 bg-blue-50" : "border-slate-200"
                }`}
              >
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.description}</p>
                </div>
                <p className="font-semibold">UGX {Number(b.price).toLocaleString()}/mo</p>
              </button>
            ))}
          </div>
        )}

        {selected.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select
                className="p-3 border rounded-2xl text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
              <div className="flex items-center justify-end font-bold text-lg">
                UGX {total.toLocaleString()}
              </div>
            </div>

            <input
              className="w-full p-3 border rounded-2xl mb-4 text-sm"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Adding..." : `Collect UGX ${total.toLocaleString()} & Add`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}