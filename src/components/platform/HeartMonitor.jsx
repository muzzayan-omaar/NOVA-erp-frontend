const THEMES = {
  HEALTHY: { color: "#34d399", label: "All systems healthy", sub: "Everything we check is within its normal range", beat: "1.5s", sweep: "2.6s" },
  DEGRADED: { color: "#fbbf24", label: "Needs attention", sub: "Nothing is down, but something deserves a look", beat: "1s", sweep: "1.8s" },
  CRITICAL: { color: "#f87171", label: "Critical", sub: "Something important is failing right now", beat: "0.55s", sweep: "1.1s" },
  UNREACHABLE: { color: "#f87171", label: "Server not responding", sub: "The health page couldn't reach the server", beat: "1.2s", sweep: "0s" },
  LOADING: { color: "#94a3b8", label: "Checking…", sub: "Running health checks", beat: "2.4s", sweep: "0s" },
};

const ECG = {
  HEALTHY: "M0 30 H70 L78 30 L84 12 L92 50 L98 30 H150 L158 24 L166 30 H300",
  DEGRADED: "M0 30 H40 L46 14 L52 46 L58 30 H110 L116 6 L124 54 L132 30 H170 L176 22 L182 30 H300",
  CRITICAL:
    "M0 30 L30 30 L36 10 L42 50 L48 14 L54 46 L60 30 L90 30 L96 8 L102 52 L108 12 L114 48 L120 30 L150 30 L156 10 L162 50 L168 30 H300",
  UNREACHABLE: "M0 30 H300",
  LOADING: "M0 30 H300",
};

export const HEART_STATUSES = ["HEALTHY", "DEGRADED", "CRITICAL", "UNREACHABLE"];

const CSS = `
@keyframes hm-beat {
  0%, 100% { transform: scale(1); }
  10% { transform: scale(1.13); }
  20% { transform: scale(1); }
  32% { transform: scale(1.08); }
  44% { transform: scale(1); }
}
@keyframes hm-ecg { from { stroke-dashoffset: 420; } to { stroke-dashoffset: 0; } }
@keyframes hm-flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@media (prefers-reduced-motion: reduce) { .hm-anim { animation: none !important; } }
`;

// The overall-status illustration: a heart that beats at a pace matching
// the system's condition, with an ECG line underneath it.
export default function HeartMonitor({ status = "LOADING", size = 150 }) {
  const theme = THEMES[status] || THEMES.LOADING;
  const flat = status === "UNREACHABLE" || status === "LOADING";
  const heartAnimation =
    status === "UNREACHABLE"
      ? `hm-flicker ${theme.beat} ease-in-out infinite`
      : `hm-beat ${theme.beat} ease-in-out infinite`;

  return (
    <div
      className="flex flex-col items-center text-center"
      role="img"
      aria-label={`System status: ${theme.label}`}
    >
      <style>{CSS}</style>

      <div className="hm-anim" style={{ animation: heartAnimation, transformOrigin: "center" }}>
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ filter: `drop-shadow(0 0 18px ${theme.color}88)` }}
        >
          <path
            fill={theme.color}
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>

      <svg viewBox="0 0 300 60" className="w-full max-w-[280px] h-14 mt-3" fill="none" aria-hidden="true">
        <path d={ECG[status] || ECG.LOADING} stroke={theme.color} strokeOpacity="0.2" strokeWidth="2" />
        {flat ? (
          <path
            d={ECG[status] || ECG.LOADING}
            stroke={theme.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 8"
          />
        ) : (
          <path
            className="hm-anim"
            d={ECG[status]}
            stroke={theme.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="420"
            strokeDasharray="420 420"
            style={{ animation: `hm-ecg ${theme.sweep} linear infinite` }}
          />
        )}
      </svg>

      <p className="text-xl font-bold mt-2" style={{ color: theme.color }}>
        {theme.label}
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-[260px]">{theme.sub}</p>
    </div>
  );
}