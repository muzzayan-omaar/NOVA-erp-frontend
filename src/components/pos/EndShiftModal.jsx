import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import { useConfirm } from "../ui/ConfirmProvider";
import { printShiftReports } from "../../utils/printShiftReports";
import { X, Wallet, Printer } from "lucide-react";

export default function EndShiftModal({ shift, storeName, onClose }) {
  const { user, logout } = useAuthStore();
  const { confirm } = useConfirm();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countedCash, setCountedCash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shifts/${shift.id}/preview`);
      setPreview(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load shift summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift.id]);

  const liveVariance = preview && countedCash !== ""
    ? Number(countedCash) - preview.expectedCash
    : null;

  const handleClose = async () => {
    if (countedCash === "" || Number(countedCash) < 0) {
      toast.error("Enter the actual counted cash amount");
      return;
    }

    const ok = await confirm({
      title: "Close your shift?",
      message: "This locks in your final reports and logs you out immediately after printing. This can't be undone.",
      confirmText: "Close Shift",
      variant: "danger",
    });
    if (!ok) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/shifts/${shift.id}/close`, { countedCash: Number(countedCash) });

      printShiftReports(res.data, user?.name, storeName);
      toast.success("Shift closed — reports printed");

      setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close shift");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-3xl shadow-nova w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet size={20} /> End Shift
          </h2>
          <button onClick={onClose} disabled={submitting}><X /></button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Loading summary...</p>
          ) : (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Opening Float</span><span>UGX {shift.openingFloat.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transactions</span><span>{preview.transactionCount}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Sales</span><span>UGX {preview.totalSales.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Expected Cash in Drawer</span><span>UGX {preview.expectedCash.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Actual Counted Cash (UGX)</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full p-4 border rounded-2xl mt-1 text-lg"
                  placeholder="Count the drawer and enter it here"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                />
              </div>

              {liveVariance !== null && (
                <div className={`rounded-2xl p-4 text-center font-semibold ${
                  Math.abs(liveVariance) < 1 ? "bg-green-50 text-green-700" :
                  liveVariance < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {Math.abs(liveVariance) < 1
                    ? "Till balances exactly"
                    : `${liveVariance < 0 ? "Shortage" : "Overage"} of UGX ${Math.abs(liveVariance).toLocaleString()}`}
                </div>
              )}

              <button
                onClick={handleClose}
                disabled={submitting}
                className="w-full bg-nova-gradient text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Printer size={18} /> {submitting ? "Closing & Printing..." : "Confirm, Print & Close Shift"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}