import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Hash } from "lucide-react";

export default function SerialPickerModal({ product, alreadyInCart, onClose, onAdd }) {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/products/${product.id}/serials`, { params: { status: "IN_STOCK" } })
      .then((res) => setSerials(res.data))
      .catch(() => toast.error("Failed to load serial numbers"))
      .finally(() => setLoading(false));
  }, [product.id]);

  const availableSerials = serials.filter((s) => !alreadyInCart.includes(s.id));

  const handlePick = (serial) => {
    onAdd({
      cartLineId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      unitLabel: product.unitType || "Piece",
      unitPrice: product.sellingPrice,
      qty: 1,
      productUnitId: null,
      productSerialId: serial.id,
      serialNumber: serial.serialNumber,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Hash size={20} /> Select a serial — {product.name}
          </h2>
          <button onClick={onClose}><X /></button>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">Loading...</p>
        ) : availableSerials.length === 0 ? (
          <p className="text-center py-10 text-slate-500">
            No available units in stock{alreadyInCart.length > 0 ? " (some are already in your cart)" : ""}.
          </p>
        ) : (
          <div className="space-y-2">
            {availableSerials.map((s) => (
              <button
                key={s.id}
                onClick={() => handlePick(s)}
                className="w-full text-left p-4 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <p className="font-mono font-semibold">{s.serialNumber}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}