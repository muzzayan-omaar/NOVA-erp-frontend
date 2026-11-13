import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import platformApi from "../../services/platformApi";

const SEVERITY = {
  critical: { chip: "bg-red-100 text-red-700", label: "Critical", dot: "bg-red-500" },
  warn: { chip: "bg-amber-100 text-amber-700", label: "Warning", dot: "bg-amber-500" },
  info: { chip: "bg-blue-100 text-nova-blue", label: "Note", dot: "bg-blue-400" },
};

function FindingRow({ finding, open, onToggle }) {
  const sev = SEVERITY[finding.severity] || SEVERITY.info;
  const more = finding.count - finding.samples.length;

  return (
    <div className="border border-slate-100 rounded-2xl">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 p-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sev.chip}`}>{sev.label}</span>
          <span className="text-xs text-slate-400 flex-shrink-0">{finding.module}</span>
          <span className="font-semibold text-slate-800 truncate">{finding.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {finding.count}
            {finding.capped ? "+" : ""}
          </span>
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <p className="text-sm text-slate-600">{finding.meaning}</p>

          <ul className="space-y-1.5">
            {finding.samples.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`} />
                <span className="text-slate-700">
                  {s.company && <span className="font-semibold">{s.company}: </span>}
                  {s.summary}
                </span>
              </li>
            ))}
          </ul>

          {more > 0 && <p className="text-xs text-slate-400">…and {more} more not shown</p>}
          {finding.scanned !== undefined && (
            <p className="text-xs text-slate-400">Looked at {finding.scanned.toLocaleString("en-US")} record(s) for this check.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Purely presentational, so it can be rendered without a server.
export function IntegrityView({ result, running, error, companies = [], companyId, onCompanyChange, onRun }) {
  // Critical findings start expanded; anything the user toggles overrides that.
  const [open, setOpen] = useState({});
  const isOpen = (f) => open[f.key] ?? f.severity === "critical";
  const toggle = (f) => setOpen((o) => ({ ...o, [f.key]: !isOpen(f) }));

  const found = result?.findings.filter((f) => f.status === "FOUND") || [];
  const errored = result?.findings.filter((f) => f.status === "ERROR") || [];
  const passed = result?.findings.filter((f) => f.status === "PASS") || [];
  const skipped = result?.findings.filter((f) => f.status === "SKIPPED") || [];

  const clean = result && found.length === 0 && errored.length === 0;
  const tone =
    result && result.summary.critical > 0
      ? "bg-red-50 border-red-200 text-red-800"
      : result && result.summary.warn > 0
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-nova-900 flex items-center gap-2">
            <ShieldCheck size={20} /> Data integrity
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Looks for things that should never happen: negative stock, sales whose payments don't add up, shifts left
            open overnight, transfers stuck in transit, and accounts that can't log in.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={companyId}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm bg-white"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={onRun}
            disabled={running}
            className="flex items-center gap-2 bg-nova-gradient text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-60"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {running ? "Scanning…" : "Run integrity scan"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!result && !error && !running && (
        <p className="text-sm text-slate-400 text-center py-6">
          Not run yet. The scan only reads data and never changes anything.
        </p>
      )}

      {result && (
        <>
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              clean ? "bg-emerald-50 border-emerald-200 text-emerald-800" : tone
            }`}
          >
            {clean ? (
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} /> No integrity problems found
              </p>
            ) : (
              <p className="font-semibold">
                {found.length === 0
                  ? "Nothing wrong was found, but some checks couldn't run"
                  : `${found.length} ${found.length === 1 ? "problem" : "problems"} found`}
              </p>
            )}
            <p className="mt-1 opacity-80">
              {result.summary.passed} of {result.summary.checks} checks passed
              {result.summary.critical > 0 && ` · ${result.summary.critical} critical`}
              {result.summary.warn > 0 && ` · ${result.summary.warn} warning${result.summary.warn === 1 ? "" : "s"}`}
              {result.summary.info > 0 && ` · ${result.summary.info} note${result.summary.info === 1 ? "" : "s"}`}
              {result.summary.errored > 0 && ` · ${result.summary.errored} couldn't run`}
              {" · "}
              {(result.durationMs / 1000).toFixed(1)}s
              {result.scope === "company" ? " · one company" : " · all companies"}
            </p>
          </div>

          {found.length > 0 && (
            <div className="space-y-3">
              {found.map((f) => (
                <FindingRow key={f.key} finding={f} open={isOpen(f)} onToggle={() => toggle(f)} />
              ))}
            </div>
          )}

          {errored.length > 0 && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p className="font-semibold text-slate-700 text-sm mb-2">Checks that couldn't run</p>
              <ul className="space-y-2">
                {errored.map((f) => (
                  <li key={f.key} className="text-sm">
                    <span className="font-medium text-slate-800">{f.title}</span>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 break-words">{f.error}</p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400 mt-3">
                A check that can't run is never counted as a pass. Send these messages to your developer.
              </p>
            </div>
          )}

          {(passed.length > 0 || skipped.length > 0) && (
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                {passed.length} {passed.length === 1 ? "check" : "checks"} passed
                {skipped.length > 0 ? `, ${skipped.length} skipped` : ""}
              </summary>
              <ul className="mt-3 space-y-1.5">
                {passed.map((f) => (
                  <li key={f.key} className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> {f.title}
                  </li>
                ))}
                {skipped.map((f) => (
                  <li key={f.key} className="flex items-center gap-2 text-slate-400">
                    <span className="w-3.5 text-center flex-shrink-0">–</span> {f.title} (skipped: {f.note})
                  </li>
                ))}
              </ul>
            </details>
          )}

          <p className="text-xs text-slate-400">
            Sales checks cover the last {result.salesWindowDays} days. Scanned {new Date(result.generatedAt).toLocaleTimeString()}.
          </p>
        </>
      )}
    </div>
  );
}

export default function IntegrityPanel() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    platformApi
      .get("/platform/companies")
      .then((res) => setCompanies(res.data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const run = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await platformApi.get("/platform/health/integrity", {
        params: { fresh: 1, ...(companyId ? { companyId } : {}) },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "The scan couldn't reach the server.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <IntegrityView
      result={result}
      running={running}
      error={error}
      companies={companies}
      companyId={companyId}
      onCompanyChange={setCompanyId}
      onRun={run}
    />
  );
}