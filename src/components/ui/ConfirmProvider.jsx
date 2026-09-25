import { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, Info, HelpCircle, Ban } from "lucide-react";

const ConfirmContext = createContext(null);

const VARIANT_STYLES = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-red-600 bg-red-50",
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-600 bg-blue-50",
    buttonClass: "bg-nova-blue hover:bg-nova-blue-dark",
  },
  blocked: {
    icon: Ban,
    iconClass: "text-amber-600 bg-amber-50",
    buttonClass: "bg-slate-900 hover:bg-slate-800",
  },
  default: {
    icon: HelpCircle,
    iconClass: "text-slate-600 bg-slate-100",
    buttonClass: "bg-slate-900 hover:bg-slate-800",
  },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  // Two-button confirmation — resolves true/false depending on the choice.
  const confirm = useCallback(
    ({
      title = "Are you sure?",
      message = "",
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "default",
    } = {}) => {
      return new Promise((resolve) => {
        setState({ title, message, confirmText, cancelText, variant, resolve, alertOnly: false });
      });
    },
    []
  );

  // One-button informational dialog — for "you can't do this because X"
  // explanations, replacing a silent console log or a bare toast when the
  // reason genuinely needs more than one line to land clearly.
  const alertDialog = useCallback(
    ({ title = "Heads up", message = "", confirmText = "OK", variant = "blocked" } = {}) => {
      return new Promise((resolve) => {
        setState({ title, message, confirmText, variant, resolve, alertOnly: true });
      });
    },
    []
  );

  const handleClose = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const V = VARIANT_STYLES[state?.variant] || VARIANT_STYLES.default;
  const Icon = V.icon;

  return (
    <ConfirmContext.Provider value={{ confirm, alert: alertDialog }}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-nova w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${V.iconClass}`}>
              <Icon size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{state.title}</h2>
            {state.message && <p className="text-sm text-slate-500 mb-6 leading-relaxed">{state.message}</p>}

            <div className="flex gap-3">
              {!state.alertOnly && (
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  {state.cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={`flex-1 py-3 rounded-2xl font-semibold text-white transition ${V.buttonClass}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Usage: const { confirm, alert } = useConfirm();
// if (!(await confirm({ title: "Cancel this order?", variant: "danger" }))) return;
// await alert({ title: "Can't approve this yet", message: "...", variant: "blocked" });
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
};