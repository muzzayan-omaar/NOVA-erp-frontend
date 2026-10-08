import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  ScanLine,
  Plus,
  CheckCircle2,
  X,
  ArrowLeft,
  PackageCheck,
} from "lucide-react";

export default function RapidScanEntry() {
  const navigate = useNavigate();
  const scanInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const [scanValue, setScanValue] = useState("");
  const [pendingBarcode, setPendingBarcode] = useState(null); // set when a scan wasn't found
  const [form, setForm] = useState({ name: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", unitType: "pcs" });
  const [saving, setSaving] = useState(false);
  const [sessionItems, setSessionItems] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pendingBarcode) {
      nameInputRef.current?.focus();
    } else {
      scanInputRef.current?.focus();
    }
  }, [pendingBarcode]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setChecking(true);
    try {
      const res = await api.get("/products/resolve-scan", { params: { code } });
      // Already exists — quick flash, no interruption, keep the pace up.
      toast.success(`Already in system: ${res.data.product.name}`, { duration: 1500 });
      setScanValue("");
    } catch (err) {
      if (err?.response?.status === 404) {
        // New item — open the quick-create panel
        setPendingBarcode(code);
        setForm({ name: "", buyingPrice: "", sellingPrice: "", stockQuantity: "1", unitType: "pcs" });
        setScanValue("");
      } else {
        toast.error("Couldn't check this code — try again");
        setScanValue("");
      }
    } finally {
      setChecking(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.sellingPrice) {
      toast.error("Name and selling price are required");
      return;
    }

    setSaving(true);

    const basePayload = {
      name: form.name.trim(),
      barcode: pendingBarcode,
      buyingPrice: form.buyingPrice || 0,
      sellingPrice: form.sellingPrice,
      stockQuantity: form.stockQuantity || 0,
      unitType: form.unitType,
    };

    try {
      const res = await api.post("/products", { ...basePayload, sku: pendingBarcode });
      finishCreate(res.data);
    } catch (err) {
      // Most likely cause: the barcode happens to collide with an existing
      // SKU. One automatic retry with a suffixed SKU keeps the flow fast
      // without ever bothering the agent for the common case.
      try {
        const retrySku = `${pendingBarcode}-2`;
        const res = await api.post("/products", { ...basePayload, sku: retrySku });
        finishCreate(res.data);
      } catch (err2) {
        toast.error(err2?.response?.data?.message || "Failed to save this item — check it manually later");
        setSaving(false);
      }
    }
  };

  const finishCreate = (product) => {
    toast.success(`Added: ${product.name}`);
    setSessionItems((prev) => [{ ...product, addedAt: Date.now() }, ...prev]);
    setPendingBarcode(null);
    setForm({ name: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", unitType: "pcs" });
    setSaving(false);
  };

  const cancelPending = () => {
    setPendingBarcode(null);
    setForm({ name: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", unitType: "pcs" });
  };

  return (
    <div className="min-h-screen bg-nova-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"
          >
            <ArrowLeft size={16} /> Exit Rapid Entry
          </button>
          <div className="flex items-center gap-2 text-white">
            <PackageCheck size={18} className="text-nova-cyan" />
            <span className="font-semibold">{sessionItems.length} item(s) added this session</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-nova p-8">
          {!pendingBarcode ? (
            <form onSubmit={handleScanSubmit}>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <ScanLine size={18} /> Scan or type a barcode
              </label>
              <input
                ref={scanInputRef}
                autoFocus
                disabled={checking}
                className="w-full p-5 text-xl border-2 border-nova-blue/30 rounded-2xl focus:outline-none focus:border-nova-blue font-mono"
                placeholder="Waiting for scan..."
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-2">
                Known items are confirmed instantly and skipped. New items open a quick entry form.
              </p>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">New item — barcode</p>
                  <p className="font-mono font-bold text-nova-blue">{pendingBarcode}</p>
                </div>
                <button type="button" onClick={cancelPending} className="text-slate-400 hover:text-slate-600">
                  <X size={22} />
                </button>
              </div>

              <input
                ref={nameInputRef}
                className="w-full p-4 border rounded-2xl text-lg"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  className="p-3 border rounded-2xl"
                  placeholder="Buying price"
                  value={form.buyingPrice}
                  onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                />
                <input
                  type="number"
                  className="p-3 border rounded-2xl"
                  placeholder="Selling price"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                />
                <input
                  type="number"
                  className="p-3 border rounded-2xl"
                  placeholder="Qty on hand"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                />
              </div>

              <select
                className="w-full p-3 border rounded-2xl"
                value={form.unitType}
                onChange={(e) => setForm({ ...form, unitType: e.target.value })}
              >
                <option value="pcs">Piece</option>
                <option value="kg">Kg</option>
                <option value="l">Litre</option>
                <option value="m">Metre</option>
                <option value="box">Box</option>
              </select>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-nova-gradient text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Plus size={18} /> {saving ? "Saving..." : "Save & Scan Next"}
              </button>
            </form>
          )}
        </div>

        {sessionItems.length > 0 && (
          <div className="bg-white/5 rounded-3xl p-5 max-h-64 overflow-y-auto">
            <p className="text-xs text-slate-400 font-semibold mb-3">ADDED THIS SESSION</p>
            <div className="space-y-2">
              {sessionItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-white/90 py-1">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-nova-cyan flex-shrink-0" />
                    {item.name}
                  </span>
                  <span className="text-white/50">Qty {item.stockQuantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}