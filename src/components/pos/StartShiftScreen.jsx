import { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import { Wallet, LogOut, ArrowRight } from "lucide-react";

export default function StartShiftScreen({ onShiftOpened }) {
  const [openingFloat, setOpeningFloat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuthStore();

  const handleStart = async (e) => {
    e.preventDefault();

    if (openingFloat === "" || Number(openingFloat) < 0) {
      toast.error("Enter the real cash amount currently in your drawer");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/shifts/open", { openingFloat: Number(openingFloat) });
      toast.success("Shift started — have a good one!");
      onShiftOpened(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start shift");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-nova-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-nova w-full max-w-md p-8">
        <div className="w-14 h-14 rounded-2xl bg-nova-gradient flex items-center justify-center mb-5">
          <Wallet size={26} className="text-white" />
        </div>

        <h1 className="text-xl font-bold text-nova-900">Start Your Shift</h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Welcome, {user?.name}. Count the cash already in your till before you begin.
        </p>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Opening Float (UGX)</label>
            <input
              type="number"
              autoFocus
              className="w-full p-4 border rounded-2xl mt-1 text-lg"
              placeholder="e.g. 50000"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-nova-gradient text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? "Starting..." : (
              <>
                Start Shift <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => { logout(); window.location.href = "/login"; }}
          className="w-full mt-4 text-slate-400 text-sm flex items-center justify-center gap-2 hover:text-slate-600"
        >
          <LogOut size={14} /> Not you? Log out
        </button>
      </div>
    </div>
  );
}