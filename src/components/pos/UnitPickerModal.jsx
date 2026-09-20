import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Package } from "lucide-react";

export default function UnitPickerModal({ product, onClose, onAdd }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("base");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api
      .get(`/products/${product.id}/units`)
      .then((res) => setUnits(res.data.filter((u) => u.isActive)))
      .catch(() => toast.error("Failed to load units"))
      .finally(() => setLoading(false));
  }, [product.id]);

  const selectedUnit = selected === "base" ? null : units.find((u) => u.id === selected);
  const unitLabel = selectedUnit ? selectedUnit.unitName : (product.unitType || "Piece");
  const unitPrice = selectedUnit
    ? (selectedUnit.sellingPrice ?? product.sellingPrice * selectedUnit.conversionFactor)
    : product.sellingPrice;
  const lineTotal = unitPrice * (Number(qty) || 0);

  const handleAdd = () => {
    if (!qty || Number(qty) <= 0) {
      toast.error("Enter a quantity");
      return;
    }

    onAdd({
      cartLineId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      unitLabel,
      unitPrice,
      qty: Number(qty),
      productUnitId: selectedUnit?.id || null,
      productSerialId: null,
      serialNumber: null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package size={20} /> {product.name}
          </h2>
          <button onClick={onClose}><X /></button>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setSelected("base")}
                className={`w-full text-left p-4 rounded-2xl border flex justify-between items-center ${
                  selected === "base" ? "border-blue-600 bg-blue-50" : "border-slate-200"
                }`}
              >
                <span className="font-medium">{product.unitType || "Piece"} (base unit)</span>
                <span className="font-semibold">UGX {product.sellingPrice.toLocaleString()}</span>
              </button>

              {units.map((u) => {
                const price = u.sellingPrice ?? product.sellingPrice * u.conversionFactor;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className={`w-full text-left p-4 rounded-2xl border flex justify-between items-center ${
                      selected === u.id ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <span className="font-medium">
                      {u.unitName} <span className="text-xs text-slate-400">({u.conversionFactor} × {product.unitType || "Piece"})</span>
                    </span>
                    <span className="font-semibold">UGX {price.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                min="0.01"
                step="any"
                className="flex-1 p-3 border rounded-xl"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center border-t pt-4 mb-4">
              <span className="text-slate-500">Line Total</span>
              <span className="text-xl font-bold">UGX {lineTotal.toLocaleString()}</span>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold"
            >
              Add to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}