import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Cpu,
  Radio,
  BarChart3,
  ShieldAlert,
  Mail,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import platformApi from "../../services/platformApi";
import HeartMonitor, { HEART_STATUSES } from "../../components/platform/HeartMonitor";

const ICONS = {
  server: Server,
  database: Database,
  memory: Cpu,
  disk: HardDrive,
  sockets: Radio,
  traffic: BarChart3,
  security: ShieldAlert,
  email: Mail,
  business: Wallet,
};

const STATUS_STYLES = {
  OK: { dot: "bg-emerald-500", text: "text-emerald-600", bar: "bg-emerald-500", label: "OK" },
  WARN: { dot: "bg-amber-500", text: "text-amber-600", bar: "bg-amber-400", label: "Warning" },
  CRITICAL: { dot: "bg-red-500", text: "text-red-600", bar: "bg-red-500", label: "Critical" },
  UNKNOWN: { dot: "bg-slate-400", text: "text-slate-500", bar: "bg-slate-400", label: "Unknown" },
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// A battery shows what's LEFT, so a nearly full disk reads as a nearly
// empty battery. Colour follows the check's own verdict, not a guess here.
function BatteryGauge({ usedPct, status }) {
  const free = Math.max(0, Math.min(100, 100 - usedPct));
  const style = STATUS_STYLES[status] || STATUS_STYLES.OK;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        <div className="flex-1 h-8 rounded-xl border-2 border-slate-300 p-1 bg-white">
          <div
            className={`h-full rounded-lg ${style.bar} transition-all duration-700`}
            style={{ width: `${Math.max(free, 3)}%` }}
          />
        </div>
        <div className="w-1.5 h-3.5 rounded-r bg-slate-300" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1.5">
        <span>{free}% free</span>
        <span>{usedPct}% used</span>
      </div>
    </div>
  );
}

function TrafficBars({ series }) {
  const max = Math.max(1, ...series.map((s) => s.total));
  return (
    <div className="flex items-end gap-[2px] h-24">
      {series.map((s) => {
        const heightPct = s.total === 0 ? 2 : Math.max(5, (s.total / max) * 100);
        const errPct = s.total > 0 ? (s.errors / s.total) * 100 : 0;
        const label = `${new Date(s.minute).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${s.total} requests, ${s.errors} errors`;
        return (
          <div key={s.minute} title={label} className="flex-1 h-full flex items-end">
            <div
              className={`w-full rounded-t relative overflow-hidden ${s.total === 0 ? "bg-slate-200" : "bg-nova-blue/70"}`}
              style={{ height: `${heightPct}%` }}
            >
              {errPct > 0 && (
                <div className="absolute bottom-0 inset-x-0 bg-red-500" style={{ height: `${errPct}%` }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheckCard({ check, stale }) {
  const style = STATUS_STYLES[check.status] || STATUS_STYLES.UNKNOWN;
  const Icon = ICONS[check.key] || Activity;
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${stale ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-nova-900">{check.label}</p>
            <p className={`text-xs font-semibold ${style.text}`}>{style.label}</p>
          </div>
        </div>
        <span className={`w-3 h-3 rounded-full mt-1.5 ${style.dot} ${check.status !== "OK" ? "animate-pulse" : ""}`} />
      </div>

      <p className="text-sm text-slate-600 mt-4">{check.message}</p>

      {check.gauge && <BatteryGauge usedPct={check.gauge.usedPct} status={check.status} />}

      {check.details?.length > 0 && (
        <dl className="mt-4 space-y-1.5 text-xs">
          {check.details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-slate-400">{label}</dt>
              <dd className="font-medium text-slate-700 text-right">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// Purely presentational, so it can be rendered without a server.
export function HealthView({ report, error, loading, refreshing, auto, onToggleAuto, onRefresh }) {
  // Lets you see every heart state without having to break anything.
  const [preview, setPreview] = useState(null);

  const cyclePreview = () => {
    const i = preview ? HEART_STATUSES.indexOf(preview) : -1;
    setPreview(i + 1 >= HEART_STATUSES.length ? null : HEART_STATUSES[i + 1]);
  };

  const realStatus = error ? "UNREACHABLE" : loading && !report ? "LOADING" : report?.overall || "LOADING";
  const heartStatus = preview || realStatus;

  const needsAttention = (report?.checks || [])
    .filter((c) => c.status === "WARN" || c.status === "CRITICAL")
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "CRITICAL" ? -1 : 1));

  const traffic = report?.traffic?.series;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity /> System Health
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Live status of the server, database, traffic and the business queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAuto}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition ${
              auto ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {auto ? "Auto-refresh on (30s)" : "Auto-refresh off"}
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-nova-900 text-white px-5 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Check now
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-nova-950 rounded-3xl shadow-nova p-8 text-white grid lg:grid-cols-[320px_1fr] gap-10 items-center">
        <HeartMonitor status={heartStatus} />

        <div>
          {preview && (
            <p className="inline-block text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full mb-4">
              Preview mode: showing a sample state, not real data
            </p>
          )}

          {report && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-3xl font-bold text-emerald-400">{report.summary.ok}</p>
                  <p className="text-xs text-slate-400 mt-1">Checks passing</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-3xl font-bold text-amber-400">{report.summary.warn}</p>
                  <p className="text-xs text-slate-400 mt-1">Warnings</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-3xl font-bold text-red-400">{report.summary.critical}</p>
                  <p className="text-xs text-slate-400 mt-1">Critical</p>
                </div>
              </div>

              <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  ["Last checked", fmtTime(report.generatedAt)],
                  ["Server uptime", report.server.uptime],
                  ["Environment", report.server.environment],
                  ["Node version", report.server.nodeVersion],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/10 py-1.5">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="text-slate-100">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {!report && error && <p className="text-slate-300 text-sm">{error}</p>}
          {!report && loading && <p className="text-slate-400 text-sm">Running the first round of checks…</p>}
        </div>
      </div>

      {error && report && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error} Showing the last known state from {fmtTime(report.generatedAt)}.
        </div>
      )}

      {/* What needs attention, in plain words */}
      {needsAttention.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-nova-900 mb-3">
            {needsAttention.length === 1 ? "1 thing needs attention" : `${needsAttention.length} things need attention`}
          </h2>
          <ul className="space-y-2">
            {needsAttention.map((c) => {
              const style = STATUS_STYLES[c.status];
              return (
                <li key={c.key} className="flex items-start gap-3 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${style.dot}`} />
                  <span>
                    <span className="font-semibold text-slate-800">{c.label}:</span>{" "}
                    <span className="text-slate-600">{c.message}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {report && (
        <>
          {traffic && (
            <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${error ? "opacity-60" : ""}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-nova-900">Requests, last 60 minutes</h2>
                <p className="text-xs text-slate-400">Red marks server errors. Resets when the server restarts.</p>
              </div>
              <TrafficBars series={traffic} />
            </div>
          )}

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {report.checks.map((c) => (
              <CheckCard key={c.key} check={c} stale={Boolean(error)} />
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <p>
          This page can only report while the server is answering. Keep an outside uptime monitor pinging
          /api/health so you hear about it when it isn't.
        </p>
        <button onClick={cyclePreview} className="underline hover:text-slate-600">
          {preview ? "Exit preview" : "Preview heart states"}
        </button>
      </div>
    </div>
  );
}

export default function PlatformHealthPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(true);

  const load = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const res = await platformApi.get("/platform/health");
      setReport(res.data);
      setError(null);
    } catch (err) {
      setError(
        err.response
          ? `The server answered with an error (${err.response.status}).`
          : "The server did not respond."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!auto) return undefined;
    const timer = setInterval(() => load(), 30000);
    return () => clearInterval(timer);
  }, [auto, load]);

  return (
    <HealthView
      report={report}
      error={error}
      loading={loading}
      refreshing={refreshing}
      auto={auto}
      onToggleAuto={() => setAuto((a) => !a)}
      onRefresh={() => load(true)}
    />
  );
}