import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { printShiftReports } from "../../../utils/printShiftReports";
import {
  History,
  ChevronDown,
  ChevronUp,
  Printer,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function ShiftHistoryModule() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [varianceOnly, setVarianceOnly] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/shifts");
      setShifts(res.data);
    } catch (err) {
      toast.error("Failed to load shift history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const hasVariance = (s) => s.status === "CLOSED" && Math.abs(s.cashVariance || 0) > 1;

  const visibleShifts = varianceOnly ? shifts.filter(hasVariance) : shifts;
  const varianceCount = shifts.filter(hasVariance).length;

  const handleReprint = (shift) => {
    printShiftReports(shift, shift.user?.name, shift.store?.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History /> Shift History
        </h1>

        {varianceCount > 0 && (
          <button
            onClick={() => setVarianceOnly(!varianceOnly)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition ${
              varianceOnly ? "bg-red-600 text-white" : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            <AlertTriangle size={16} /> {varianceCount} with variance
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8">
        {loading ? (
          <p className="text-center text-slate-500 py-16">Loading...</p>
        ) : visibleShifts.length === 0 ? (
          <p className="text-center text-slate-500 py-16">
            {varianceOnly ? "No shifts with variance — everything balances" : "No shifts recorded yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleShifts.map((s) => {
              const isOpen = expandedId === s.id;
              const variance = s.cashVariance || 0;
              const balanced = s.status === "CLOSED" && Math.abs(variance) < 1;

              return (
                <div key={s.id} className="border rounded-2xl p-5">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedId(isOpen ? null : s.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{s.user?.name}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          s.status === "OPEN" ? "bg-blue-100 text-nova-blue" : "bg-slate-100 text-slate-600"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {s.store?.name} · Opened {new Date(s.openedAt).toLocaleString()}
                        {s.closedAt && ` · Closed ${new Date(s.closedAt).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {s.status === "CLOSED" && (
                        <div className="text-right">
                          {balanced ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                              <CheckCircle2 size={14} /> Balanced
                            </span>
                          ) : (
                            <span className={`text-sm font-semibold ${variance < 0 ? "text-red-600" : "text-amber-600"}`}>
                              {variance < 0 ? "Short" : "Over"} UGX {Math.abs(variance).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isOpen && s.status === "CLOSED" && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Opening Float</p>
                          <p className="font-bold">UGX {s.openingFloat.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Total Sales</p>
                          <p className="font-bold">UGX {(s.totalSales || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Expected Cash</p>
                          <p className="font-bold">UGX {(s.expectedCash || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Counted Cash</p>
                          <p className="font-bold">UGX {(s.countedCash || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      {s.productMix?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-2">Product Mix</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {s.productMix.map((p) => (
                              <div key={p.productId} className="flex justify-between text-xs text-slate-600">
                                <span>{p.name} × {p.qty}</span>
                                <span>UGX {p.revenue.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleReprint(s)}
                        className="flex items-center gap-2 text-sm font-medium text-nova-blue px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50"
                      >
                        <Printer size={14} /> Reprint Reports
                      </button>
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