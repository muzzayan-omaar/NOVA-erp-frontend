import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

// Same dependency-free parser used for Bank Reconciliation.
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

const FIELDS = [
  { key: "name", label: "Product Name", required: true },
  { key: "sku", label: "SKU (optional)", required: false },
  { key: "barcode", label: "Barcode (optional)", required: false },
  { key: "buyingPrice", label: "Buying Price", required: false },
  { key: "sellingPrice", label: "Selling Price", required: true },
  { key: "stockQuantity", label: "Quantity on Hand", required: false },
  { key: "unitType", label: "Unit (e.g. pcs, kg)", required: false },
];

export default function BulkProductImport() {
  const navigate = useNavigate();

  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
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

      const auto = {};
      FIELDS.forEach((f) => {
        const idx = parsed[0].findIndex((h) => h.toLowerCase().includes(f.key.toLowerCase().slice(0, 4)));
        if (idx !== -1) auto[f.key] = idx;
      });
      setMapping(auto);
    };
    reader.readAsText(file);
  };

  const canImport = mapping.name !== undefined && mapping.sellingPrice !== undefined;

  const runImport = async () => {
    try {
      setImporting(true);

      const rows = dataRows.map((row) => {
        const get = (key) => (mapping[key] !== undefined ? row[mapping[key]] : undefined);
        return {
          name: get("name"),
          sku: get("sku"),
          barcode: get("barcode"),
          buyingPrice: get("buyingPrice"),
          sellingPrice: get("sellingPrice"),
          stockQuantity: get("stockQuantity"),
          unitType: get("unitType"),
        };
      });

      const res = await api.post("/products/bulk-import", { rows });
      setResult(res.data);

      if (res.data.successCount > 0) {
        toast.success(`${res.data.successCount} product(s) imported`);
      }
      if (res.data.failedCount > 0) {
        toast.error(`${res.data.failedCount} row(s) need attention`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const failedRows = result?.results.filter((r) => r.status === "FAILED") || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Products
      </button>

      <h1 className="text-2xl font-bold flex items-center gap-3">
        <FileSpreadsheet /> Bulk Product Import
      </h1>

      <div className="bg-white rounded-3xl shadow p-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Upload Spreadsheet (CSV)</label>
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
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Map your columns</p>
              <div className="grid grid-cols-2 gap-4">
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-500">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      className="w-full p-3 border rounded-xl mt-1 text-sm"
                      value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) })}
                    >
                      <option value="">Not in this file</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={runImport}
              disabled={!canImport || importing}
              className="w-full bg-nova-gradient text-white py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload size={18} /> {importing ? `Importing ${dataRows.length} rows...` : `Import ${dataRows.length} Products`}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
              <p className="text-xs text-slate-500">Imported Successfully</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-red-600">{result.failedCount}</p>
              <p className="text-xs text-slate-500">Need Attention</p>
            </div>
          </div>

          {failedRows.length > 0 && (
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="font-bold flex items-center gap-2 text-red-600 mb-4">
                <AlertTriangle size={18} /> Rows That Didn't Import
              </h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {failedRows.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm border-b py-2">
                    <span>Row {r.row}{r.name ? ` — ${r.name}` : ""}</span>
                    <span className="text-red-500">{r.reason}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Fix these in your spreadsheet and re-upload just those rows — already-imported items won't duplicate as long as their SKU or barcode is unique.
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/admin/products")}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} /> Done — View Products
          </button>
        </div>
      )}
    </div>
  );
}