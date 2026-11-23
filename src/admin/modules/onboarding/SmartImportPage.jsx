import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FIELD_DEFS, analyzeCsvBuffer, applyMapping, buildTemplateCsv } from "../../../utils/smartImport";

const MAX_BYTES = 25 * 1024 * 1024;

const downloadTemplate = () => {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "novrr-products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const hasError = (r) => r.issues.some((i) => i.level === "error");

function MappingChip({ def, entry }) {
  if (entry && entry.confident) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Matched</span>;
  if (entry) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Please confirm</span>;
  if (def.required) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Needed</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Not in file</span>;
}

const fmt = (v) => (v === null || v === undefined ? "—" : typeof v === "number" ? v.toLocaleString("en-US") : v);

// Purely presentational, so it can be rendered without a browser.
export function SmartImportView({ fileName, analysis, mapping, onMappingChange, normalized, error, onFile, onBack }) {
  const rows = normalized?.rows || [];
  const errorRows = rows.filter(hasError).length;
  const warningRows = rows.filter((r) => !hasError(r) && r.issues.length > 0).length;
  const fineRows = rows.length - errorRows - warningRows;
  const nameMapped = Boolean(mapping.name);

  const previewRows = [
    ...rows.filter(hasError),
    ...rows.filter((r) => !hasError(r) && r.issues.length > 0),
    ...rows.filter((r) => r.issues.length === 0),
  ].slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
        <ArrowLeft size={18} /> Back to Products
      </button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileSpreadsheet /> Smart Import: products
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Drop in a product list from Excel, Tally or any other system. We'll tell you what we found before anything is saved.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 bg-nova-gradient text-white px-6 py-3 rounded-2xl font-semibold cursor-pointer">
            <Upload size={18} /> Choose a CSV file
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
          </label>
          <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm font-medium text-nova-blue px-4 py-3 rounded-2xl border border-blue-200 hover:bg-blue-50">
            <Download size={16} /> Download our template
          </button>
          {fileName && <span className="text-sm text-slate-500">{fileName}</span>}
        </div>
        <p className="text-xs text-slate-400">
          Works with CSV and text files, including Tally report exports. Have an Excel workbook (.xlsx)? Open it, choose File, Save As, CSV, and upload that.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}
      </div>

      {analysis && analysis.empty && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 text-sm">This file is empty. Check you chose the right one.</div>
      )}

      {analysis && !analysis.empty && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Rows found", analysis.rowCount.toLocaleString("en-US")],
              ["Headings on row", String(analysis.headerRow)],
              ["Columns separated by", analysis.delimiterName],
              ["Text encoding", analysis.encoding],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="font-bold text-nova-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {analysis.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <p className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Things we noticed</p>
              <ul className="space-y-1 text-sm text-amber-800 list-disc ml-5">
                {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="font-bold text-lg mb-1">Which column is which?</h2>
            <p className="text-sm text-slate-500 mb-5">We matched what we could. Anything marked "Please confirm" could mean more than one thing, so check it.</p>
            <div className="space-y-3">
              {FIELD_DEFS.map((def) => {
                const entry = mapping[def.key];
                return (
                  <div key={def.key} className="grid grid-cols-[1fr_1.4fr_auto] gap-4 items-center">
                    <p className="text-sm font-medium text-slate-700">
                      {def.label} {def.required && <span className="text-red-500">*</span>}
                    </p>
                    <select
                      className="p-3 border rounded-xl text-sm"
                      value={entry ? entry.index : ""}
                      onChange={(e) => onMappingChange(def.key, e.target.value === "" ? null : Number(e.target.value))}
                    >
                      <option value="">Not in this file</option>
                      {analysis.headers.map((h, i) => (
                        <option key={i} value={i}>{`Column ${i + 1}: ${h || "(blank)"}`}</option>
                      ))}
                    </select>
                    <MappingChip def={def} entry={entry} />
                  </div>
                );
              })}
            </div>
          </div>

          {!nameMapped ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">Choose which column holds the product name to see a preview.</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-emerald-600">{fineRows}</p><p className="text-xs text-slate-500">Look fine</p></div>
                <div className="bg-amber-50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-amber-600">{warningRows}</p><p className="text-xs text-slate-500">Have a warning</p></div>
                <div className="bg-red-50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-red-600">{errorRows}</p><p className="text-xs text-slate-500">Have a problem</p></div>
              </div>
              {normalized.skippedTotals > 0 && (
                <p className="text-xs text-slate-400">Left out {normalized.skippedTotals} "Total" row{normalized.skippedTotals === 1 ? "" : "s"}, since those are sums, not products.</p>
              )}

              <div className="bg-white rounded-3xl shadow p-6 overflow-x-auto">
                <h2 className="font-bold mb-3">Preview <span className="text-xs font-normal text-slate-400">(problem rows first)</span></h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b">
                      <th className="py-2 pr-3">Row</th><th className="pr-3">Name</th><th className="pr-3">SKU</th><th className="pr-3">Buy</th><th className="pr-3">Sell</th><th className="pr-3">Qty</th><th className="pr-3">Unit</th><th>What we noticed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r) => (
                      <tr key={r.rowNumber} className={`border-b ${hasError(r) ? "bg-red-50/60" : r.issues.length ? "bg-amber-50/60" : ""}`}>
                        <td className="py-2 pr-3 text-slate-400">{r.rowNumber}</td>
                        <td className="pr-3 font-medium">{r.name || "—"}</td>
                        <td className="pr-3">{fmt(r.sku)}</td>
                        <td className="pr-3">{fmt(r.buyingPrice)}</td>
                        <td className="pr-3">{fmt(r.sellingPrice)}</td>
                        <td className="pr-3">{fmt(r.stockQuantity)}</td>
                        <td className="pr-3">{fmt(r.unitType)}</td>
                        <td className={`text-xs ${hasError(r) ? "text-red-600" : "text-amber-700"}`}>
                          {r.issues.length === 0 ? <CheckCircle2 size={14} className="text-emerald-500" /> : r.issues.slice(0, 2).map((i) => i.message).join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl px-5 py-4 text-sm">
                Nothing has been saved. The next update adds the check against your existing products, then the import itself, with an undo.
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SmartImportPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("That file is over 25 MB. Split it into smaller files and import them one at a time.");
      return;
    }
    if (/\.xlsx?$/i.test(file.name)) {
      setError("That's an Excel workbook. Open it in Excel, choose File, Save As, CSV, and upload the CSV instead. Direct Excel support is coming.");
      return;
    }

    try {
      const result = analyzeCsvBuffer(await file.arrayBuffer());
      setFileName(file.name);
      setAnalysis(result);
      setMapping(result.mapping || {});
    } catch {
      setError("We couldn't read that file. Try saving it again as CSV.");
    }
  };

  // Choosing a column for a field means a person has confirmed it. A column
  // can only feed one field, so it's removed from any other field it had.
  const handleMappingChange = (field, index) => {
    setMapping((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (index !== null && next[k].index === index) delete next[k];
      if (index === null) delete next[field];
      else next[field] = { index, confident: true };
      return next;
    });
  };

  const normalized = useMemo(
    () => (analysis && !analysis.empty && mapping.name ? applyMapping(analysis.dataRows, mapping, analysis.headerRow + 1) : null),
    [analysis, mapping]
  );

  return (
    <SmartImportView
      fileName={fileName}
      analysis={analysis}
      mapping={mapping}
      onMappingChange={handleMappingChange}
      normalized={normalized}
      error={error}
      onFile={handleFile}
      onBack={() => navigate("/admin/products")}
    />
  );
}