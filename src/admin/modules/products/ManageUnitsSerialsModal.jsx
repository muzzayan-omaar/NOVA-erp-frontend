import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { X, Package, Hash, Plus, Power } from "lucide-react";

export default function ManageUnitsSerialsModal({ product, onClose, onChanged }) {
  const [tab, setTab] = useState("units");

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitForm, setUnitForm] = useState({ unitName: "", conversionFactor: "", barcode: "", sellingPrice: "", buyingPrice: "" });
  const [savingUnit, setSavingUnit] = useState(false);

  const [serials, setSerials] = useState([]);
  const [loadingSerials, setLoadingSerials] = useState(true);
  const [serialInput, setSerialInput] = useState("");
  const [savingSerials, setSavingSerials] = useState(false);

  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const res = await api.get(`/products/${product.id}/units`);
      setUnits(res.data);
    } catch (err) {
      toast.error("Failed to load units");
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchSerials = async () => {
    try {
      setLoadingSerials(true);
      const res = await api.get(`/products/${product.id}/serials`);
      setSerials(res.data);
    } catch (err) {
      toast.error("Failed to load serials");
    } finally {
      setLoadingSerials(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchSerials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const createUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.unitName || !unitForm.conversionFactor) {
      toast.error("Unit name and conversion factor are required");
      return;
    }
    try {
      setSavingUnit(true);
      await api.post(`/products/${product.id}/units`, unitForm);
      toast.success("Unit added");
      setUnitForm({ unitName: "", conversionFactor: "", barcode: "", sellingPrice: "", buyingPrice: "" });
      fetchUnits();
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add unit");
    } finally {
      setSavingUnit(false);
    }
  };

  const toggleUnitActive = async (unit) => {
    try {
      await api.patch(`/products/${product.id}/units/${unit.id}`, { isActive: !unit.isActive });
      fetchUnits();
      onChanged();
    } catch (err) {
      toast.error("Failed to update unit");
    }
  };

  const addSerials = async (e) => {
    e.preventDefault();
    const serialNumbers = serialInput.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (serialNumbers.length === 0) {
      toast.error("Enter at least one serial number");
      return;
    }
    try {
      setSavingSerials(true);
      const res = await api.post(`/products/${product.id}/serials`, { serialNumbers });
      toast.success(res.data.message);
      setSerialInput("");
      fetchSerials();
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add serials");
    } finally {
      setSavingSerials(false);
    }
  };

  const updateSerialStatus = async (serial, status) => {
    try {
      await api.patch(`/products/${product.id}/serials/${serial.id}`, { status });
      toast.success("Status updated");
      fetchSerials();
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const statusStyles = {
    IN_STOCK: "bg-green-100 text-green-600",
    IN_TRANSIT: "bg-blue-100 text-blue-600",
    SOLD: "bg-slate-200 text-slate-600",
    RETURNED_DEFECTIVE: "bg-red-100 text-red-600",
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{product.name} — Units & Serials</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="flex gap-2 p-6 pb-0">
          <button
            onClick={() => setTab("units")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium ${tab === "units" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
          >
            <Package size={16} /> Extra Units
          </button>
          <button
            onClick={() => setTab("serials")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium ${tab === "serials" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
          >
            <Hash size={16} /> Serial Numbers
          </button>
        </div>

        <div className="p-6">
          {tab === "units" && (
            <div className="space-y-6">
              <form onSubmit={createUnit} className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Unit name (e.g. Bundle)"
                    className="p-3 border rounded-xl text-sm"
                    value={unitForm.unitName}
                    onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder={`How many ${product.unitType || "base units"} = 1?`}
                    className="p-3 border rounded-xl text-sm"
                    value={unitForm.conversionFactor}
                    onChange={(e) => setUnitForm({ ...unitForm, conversionFactor: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    placeholder="Barcode (optional)"
                    className="p-3 border rounded-xl text-sm"
                    value={unitForm.barcode}
                    onChange={(e) => setUnitForm({ ...unitForm, barcode: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Sell price (optional)"
                    className="p-3 border rounded-xl text-sm"
                    value={unitForm.sellingPrice}
                    onChange={(e) => setUnitForm({ ...unitForm, sellingPrice: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Cost price (optional)"
                    className="p-3 border rounded-xl text-sm"
                    value={unitForm.buyingPrice}
                    onChange={(e) => setUnitForm({ ...unitForm, buyingPrice: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Leave sell/cost price blank to auto-calculate from the base price × conversion factor.
                </p>
                <button
                  type="submit"
                  disabled={savingUnit}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> {savingUnit ? "Adding..." : "Add Unit"}
                </button>
              </form>

              {loadingUnits ? (
                <p className="text-center text-slate-500 py-6">Loading...</p>
              ) : units.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No extra units yet — this product only sells as {product.unitType || "a base unit"}.</p>
              ) : (
                <div className="space-y-2">
                  {units.map((u) => (
                    <div key={u.id} className="flex justify-between items-center border rounded-xl p-4 text-sm">
                      <div>
                        <p className={`font-medium ${!u.isActive ? "text-slate-400 line-through" : ""}`}>
                          {u.unitName} ({u.conversionFactor} × {product.unitType || "base"})
                        </p>
                        <p className="text-xs text-slate-400">
                          {u.barcode ? `Barcode: ${u.barcode}` : "No barcode"}
                        </p>
                      </div>
                      <button onClick={() => toggleUnitActive(u)} className="flex items-center gap-1 text-xs text-blue-600">
                        <Power size={14} /> {u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "serials" && (
            <div className="space-y-6">
              <form onSubmit={addSerials} className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <label className="text-sm font-medium text-slate-700">Add serial numbers (one per line, or comma-separated)</label>
                <textarea
                  className="w-full p-3 border rounded-xl text-sm font-mono"
                  rows={4}
                  placeholder={"SN00123\nSN00124\nSN00125"}
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={savingSerials}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {savingSerials ? "Adding..." : "Add Serials"}
                </button>
              </form>

              {loadingSerials ? (
                <p className="text-center text-slate-500 py-6">Loading...</p>
              ) : serials.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No serial numbers recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {serials.map((s) => (
                    <div key={s.id} className="flex justify-between items-center border rounded-xl p-3 text-sm">
                      <span className="font-mono">{s.serialNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[s.status]}`}>
                          {s.status.replace("_", " ")}
                        </span>
                        {s.status === "IN_STOCK" && (
                          <button
                            onClick={() => updateSerialStatus(s, "RETURNED_DEFECTIVE")}
                            className="text-xs text-red-500 underline"
                          >
                            Mark Defective
                          </button>
                        )}
                        {s.status === "RETURNED_DEFECTIVE" && (
                          <button
                            onClick={() => updateSerialStatus(s, "IN_STOCK")}
                            className="text-xs text-green-600 underline"
                          >
                            Restock
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}