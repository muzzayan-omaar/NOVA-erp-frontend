import { useEffect, useState } from "react";
import { ShoppingCart, Package, Truck, BarChart3 } from "lucide-react";

const SLIDES = [
  {
    icon: ShoppingCart,
    accent: "from-nova-cyan to-nova-blue",
    title: "Sell with total accuracy",
    tip: "Scan any barcode — Nova knows if it’s a bundle, a single piece, or a specific serial number automatically.",
    screenshotSrc: null,
  },
  {
    icon: Package,
    accent: "from-emerald-400 to-nova-blue",
    title: "Inventory that never lies",
    tip: "Real-time stock across every branch, with two-step transfers so nothing goes missing unnoticed.",
    screenshotSrc: null,
  },
  {
    icon: Truck,
    accent: "from-amber-400 to-nova-blue",
    title: "Know your suppliers, really",
    tip: "Real fulfillment rate, real lead time, real on-time delivery — built from actual order history.",
    screenshotSrc: null,
  },
  {
    icon: BarChart3,
    accent: "from-nova-cyan to-indigo-500",
    title: "Nine real reports",
    tip: "From Profit & Loss to VAT Summary — every number is real, exportable to PDF or Excel.",
    screenshotSrc: null,
  },
];

const INTERVAL = 4800;

export default function TipCarousel() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / INTERVAL, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [index]);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className="select-none">
      {/* Illustration card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-nova-800/80 h-44">
        {/* Soft ambient glow that follows the accent */}
        <div
          className={`absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br ${slide.accent} opacity-25 blur-3xl transition-opacity duration-700`}
        />

        {slide.screenshotSrc ? (
          <img
            src={slide.screenshotSrc}
            alt={slide.title}
            className="absolute -top-4 -left-4 w-[130%] h-[130%] object-cover object-left-top transition-opacity duration-500"
            style={{
              maskImage:
                "radial-gradient(ellipse 75% 75% at 0% 0%, black 35%, transparent 78%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 75% at 0% 0%, black 35%, transparent 78%)",
            }}
          />
        ) : (
          <div
            className="absolute -top-5 -left-5 w-44 h-44 transition-all duration-700 ease-out"
            style={{
              maskImage:
                "radial-gradient(ellipse 75% 75% at 0% 0%, black 42%, transparent 82%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 75% at 0% 0%, black 42%, transparent 82%)",
            }}
          >
            <div
              className={`w-full h-full rounded-3xl bg-gradient-to-br ${slide.accent} opacity-90 flex items-start justify-start p-5 shadow-lg`}
            >
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3.5 ring-1 ring-white/30">
                <Icon size={26} className="text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Faint “UI chrome” hint */}
        <div className="absolute top-7 left-28 right-7 space-y-2.5 opacity-25 pointer-events-none">
          <div className="h-2 bg-white/50 rounded-full w-3/4" />
          <div className="h-2 bg-white/35 rounded-full w-1/2" />
          <div className="h-2 bg-white/25 rounded-full w-2/3" />
        </div>
      </div>

      {/* Copy */}
      <div className="mt-5 min-h-[4.5rem]">
        <p
          key={slide.title}
          className="font-semibold text-white text-[15px] leading-snug animate-in fade-in duration-500"
        >
          {slide.title}
        </p>
        <p
          key={slide.tip}
          className="text-xs text-slate-400 mt-1.5 leading-relaxed animate-in fade-in duration-500 delay-75"
        >
          {slide.tip}
        </p>
      </div>

      {/* Dots + progress */}
      <div className="flex items-center gap-2 mt-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-cyan/60"
            style={{
              width: i === index ? 28 : 6,
              backgroundColor: i === index ? "transparent" : "rgba(255,255,255,0.18)",
            }}
            aria-label={`Go to tip ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          >
            {i === index && (
              <>
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                <div
                  className="absolute inset-y-0 left-0 bg-nova-cyan rounded-full transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}