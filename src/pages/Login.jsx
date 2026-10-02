import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import {
  Building2,
  Hash,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import TipCarousel from "../components/auth/TipCarousel";
import FieldError, { inputErrorClass } from "../components/ui/FieldError";

export default function Login() {
  const [storeCode, setStoreCode] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const clearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");

    const errors = {};
    if (!storeCode.trim()) errors.storeCode = "Store code is required";
    if (!staffId.trim()) errors.staffId = "Staff ID is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { storeCode, staffId, password });
      const { token, user } = res.data;

      setAuth(user, token);
      toast.success("Welcome back!");

      if (user.role === "GENERAL_MANAGER" || user.role === "BRANCH_MANAGER") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Invalid credentials";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nova-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-nova-blue/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-nova-cyan/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl">
        <div className="grid md:grid-cols-[1fr_1.15fr] rounded-3xl overflow-hidden shadow-nova">
          {/* LEFT — brand panel */}
          <div className="bg-nova-900 p-8 md:p-9 hidden md:flex md:flex-col justify-center gap-8">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-nova-gradient flex items-center justify-center font-bold text-white text-base">
                  N
                </div>
                <div>
                  <p className="text-white font-bold tracking-tight leading-none text-sm">
                    NOVRR <span className="text-nova-cyan">ERP</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Smarter Business. Greater Control.</p>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mt-6 leading-tight">
                Run your business on{" "}
                <span className="bg-nova-gradient bg-clip-text text-transparent">real numbers.</span>
              </h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                One system for sales, inventory, procurement, and reporting —
                built for real businesses.
              </p>
            </div>

            <TipCarousel />
          </div>

          {/* RIGHT — form panel */}
          <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 md:hidden mb-6">
              <div className="w-8 h-8 rounded-lg bg-nova-gradient flex items-center justify-center font-bold text-white text-sm">
                N
              </div>
              <p className="font-bold text-nova-900">
                NOVRR <span className="text-nova-blue">ERP</span>
              </p>
            </div>

            <h2 className="text-xl font-bold text-nova-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1 mb-6">Sign in with your Store Code and Staff ID</p>

            {formError && (
              <div className="bg-red-50 text-red-700 text-sm font-medium rounded-2xl px-4 py-2.5 mb-5">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Store Code</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. MBSHQ123"
                    className={`w-full pl-11 pr-4 py-3 border rounded-2xl uppercase transition ${inputErrorClass(fieldErrors.storeCode)}`}
                    value={storeCode}
                    onChange={(e) => { setStoreCode(e.target.value); clearError("storeCode"); }}
                  />
                </div>
                <FieldError message={fieldErrors.storeCode} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Staff ID</label>
                <div className="relative mt-1">
                  <Hash className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. STF4821"
                    className={`w-full pl-11 pr-4 py-3 border rounded-2xl uppercase transition ${inputErrorClass(fieldErrors.staffId)}`}
                    value={staffId}
                    onChange={(e) => { setStaffId(e.target.value); clearError("staffId"); }}
                  />
                </div>
                <FieldError message={fieldErrors.staffId} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`w-full pl-11 pr-11 py-3 border rounded-2xl transition ${inputErrorClass(fieldErrors.password)}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-nova-gradient text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-95"
              >
                {loading ? "Signing in..." : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-6 pt-4 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-nova-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Secure and trusted. By signing in you agree to our{" "}
                <a href="/terms" target="_blank" className="underline text-slate-500">Terms</a> and{" "}
                <a href="/privacy" target="_blank" className="underline text-slate-500">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-slate-500 text-xs">
            NOVRR ERP<span className="align-super text-[9px]">™</span> &nbsp;|&nbsp; v1.0
          </p>
          <p className="text-slate-600 text-[11px] mt-1">
            Inventory &nbsp;•&nbsp; Sales &nbsp;•&nbsp; Purchases &nbsp;•&nbsp; Payroll &nbsp;•&nbsp; Reports &nbsp;•&nbsp; More
          </p>
        </div>
      </div>
    </div>
  );
}