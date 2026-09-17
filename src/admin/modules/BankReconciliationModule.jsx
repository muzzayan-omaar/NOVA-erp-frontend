import { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Landmark, Upload, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

// Simple, dependency-free CSV parser — handles basic quoted fields.
function parseCsv(text) {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export default function BankReconciliationModule() {
  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [fileName, setFileName] = useState("");

  const [columnMode, setColumnMode] = useState("single");
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [debitCol, setDebitCol] = useState("");
  const [creditCol, setCreditCol] = useState("");
  const [dateTolerance, setDateTolerance] = useState(3);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseCsv(evt.target.result);
      if (parsed.length < 2) {
        toast.error("This file doesn't look like it has any data rows");
        return;
      }
      setHeaders(parsed[0]);
      setDataRows(parsed.slice(1));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const canRun =
    dateCol !== "" &&
    descCol !== "" &&
    (columnMode === "single" ? amountCol !== "" : debitCol !== "" || creditCol !== "");

  const runReconciliation = async () => {
    try {
      setLoading(true);

      const rows = dataRows
        .map((row) => {
          const date = row[Number(dateCol)];
          const description = row[Number(descCol)];

          let amount;
          if (columnMode === "single") {
            amount = parseFloat(row[Number(amountCol)]?.replace(/,/g, ""));
          } else {
            const debitVal = debitCol !== "" ? parseFloat(row[Number(debitCol)]?.replace(/,/g, "")) : 0;
            const creditVal = creditCol !== "" ? parseFloat(row[Number(creditCol)]?.replace(/,/g, "")) : 0;
            amount = (creditVal || 0) - (debitVal || 0);
          }

          return { date, description, amount };
        })
        .filter((r) => r.date && !isNaN(r.amount) && r.amount !== 0);

      if (rows.length === 0) {
        toast.error("No usable rows found — check your column mapping");
        return;
      }

      const res = await api.post("/reconciliation/match", { rows, dateToleranceDays: Number(dateTolerance) });
      setResult(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reconciliation failed");
    } finally {
      setLoading(false);
    }
  };

  const matched = result?.results.filter((r) => r.status === "MATCHED") || [];
  const multiple = result?.results.filter((r) => r.status === "MULTIPLE_CANDIDATES") || [];
  const unmatched = result?.results.filter((r) => r.status === "UNMATCHED") || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Landmark /> Bank Reconciliation
      </h1>

      <div className="bg-blue-50 text-blue-700 rounded-2xl p-4 text-sm flex gap-2">
        <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
        Only transactions recorded with "Bank Transfer" as the payment method are checked here —
        Cash, Mobile Money, and Card settle on different timing and aren't compared against a bank
        statement this way.
      </div>

      <div className="bg-white rounded-3xl shadow p-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Upload Bank Statement (CSV)</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="w-full p-4 border rounded-2xl mt-1"
          />
          {fileName && <p className="text-xs text-slate-400 mt-1">Loaded: {fileName} ({dataRows.length} rows)</p>}
        </div>

        {headers.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Date Column</label>
                <select className="w-full p-3 border rounded-xl mt-1" value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                  <option value="">Select column</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description Column</label>
                <select className="w-full p-3 border rounded-xl mt-1" value={descCol} onChange={(e) => setDescCol(e.target.value)}>
                  <option value="">Select column</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setColumnMode("single")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${columnMode === "single" ? "bg-slate-900 text-white" : "bg-slate-200"}`}
              >
                Single Amount Column
              </button>
              <button
                onClick={() => setColumnMode("debitCredit")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${columnMode === "debitCredit" ? "bg-slate-900 text-white" : "bg-slate-200"}`}
              >
                Separate Debit / Credit Columns
              </button>
            </div>

            {columnMode === "single" ? (
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Amount Column (positive = money in, negative = money out)
                </label>
                <select className="w-full p-3 border rounded-xl mt-1" value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
                  <option value="">Select column</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Debit (money out) Column</label>
                  <select className="w-full p-3 border rounded-xl mt-1" value={debitCol} onChange={(e) => setDebitCol(e.target.value)}>
                    <option value="">None</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Credit (money in) Column</label>
                  <select className="w-full p-3 border rounded-xl mt-1" value={creditCol} onChange={(e) => setCreditCol(e.target.value)}>
                    <option value="">None</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Date Tolerance (days)</label>
              <input
                type="number"
                className="w-32 p-3 border rounded-xl mt-1"
                value={dateTolerance}
                onChange={(e) => setDateTolerance(e.target.value)}
              />
            </div>

            <button
              onClick={runReconciliation}
              disabled={!canRun || loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload size={18} /> {loading ? "Matching..." : "Run Reconciliation"}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{matched.length}</p>
              <p className="text-xs text-slate-500">Matched</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">{multiple.length}</p>
              <p className="text-xs text-slate-500">Needs Review</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-red-600">{unmatched.length}</p>
              <p className="text-xs text-slate-500">Unmatched</p>
            </div>
          </div>

          {multiple.length > 0 && (
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-600">
                <AlertTriangle size={20} /> Needs Manual Review
              </h2>
              {multiple.map((row, i) => (
                <div key={i} className="border rounded-2xl p-4 mb-3">
                  <p className="font-medium text-sm">{row.description} — UGX {Math.abs(row.amount).toLocaleString()} ({row.date})</p>
                  <p className="text-xs text-slate-500 mt-2">Possible matches:</p>
                  {row.candidates.map((c) => (
                    <p key={c.id} className="text-xs text-slate-600 ml-3">
                      • {c.description} — UGX {c.amount.toLocaleString()} on {new Date(c.date).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {unmatched.length > 0 && (
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} /> On the Statement, Not Found in Nova
              </h2>
              {unmatched.map((row, i) => (
                <div key={i} className="flex justify-between text-sm border-b py-3">
                  <span>{row.description} ({row.date})</span>
                  <span className="font-semibold">UGX {Math.abs(row.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {result.unmatchedInternal.length > 0 && (
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-600">
                <AlertTriangle size={20} /> Recorded in Nova, Not Found on Statement
              </h2>
              {result.unmatchedInternal.map((c) => (
                <div key={c.id} className="flex justify-between text-sm border-b py-3">
                  <span>{c.description} ({new Date(c.date).toLocaleDateString()})</span>
                  <span className="font-semibold">UGX {c.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {matched.length > 0 && (
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-600">
                <CheckCircle2 size={20} /> Matched
              </h2>
              {matched.map((row, i) => (
                <div key={i} className="flex justify-between text-sm border-b py-3">
                  <span>{row.description} → {row.match.description}</span>
                  <span className="font-semibold">UGX {Math.abs(row.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}