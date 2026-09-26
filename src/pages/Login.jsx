import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import TipCarousel from "../components/auth/TipCarousel";
import FieldError, { inputErrorClass } from "../components/ui/FieldError";

export default function Login() {
  const [businessCode, setBusinessCode] = useState("");
  const [email, setEmail] = useState("");
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
    if (!businessCode.trim()) errors.businessCode = "Business code is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { businessCode, email, password });
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
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] bg-nova-blue/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-40 w-[28rem] h-[28rem] bg-nova-cyan/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-nova-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="grid md:grid-cols-[0.95fr_1.15fr] rounded-3xl overflow-hidden shadow-nova border border-white/5">
          {/* LEFT — brand panel */}
          <div className="bg-nova-900 p-8 md:p-10 hidden md:flex md:flex-col justify-between gap-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 overflow-hidden flex items-center justify-center">
                  <img
                    src="/favicon.png"
                    alt="NOVA ERP"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-white font-bold tracking-tight leading-none text-[15px]">
                    NOVA <span className="text-nova-cyan">ERP™</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 tracking-wide">
                    Smarter Business. Greater Control.
                  </p>
                </div>
              </div>

              <h1 className="text-[1.65rem] font-bold text-white mt-8 leading-[1.25] tracking-tight">
                Run your business on{" "}
                <span className="bg-nova-gradient bg-clip-text text-transparent">
                  real numbers.
                </span>
              </h1>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-[18rem]">
                One system for sales, inventory, procurement, and reporting —
                built for real businesses.
              </p>
            </div>

            <TipCarousel />
          </div>

          {/* RIGHT — form panel */}
          <div className="bg-white p-8 md:p-11 flex flex-col justify-center">
            {/* Mobile brand */}
            <div className="flex items-center gap-2.5 md:hidden mb-7">
              <div className="w-9 h-9 rounded-xl bg-nova-gradient flex items-center justify-center font-bold text-white text-sm shadow-sm">
                N
              </div>
              <p className="font-bold text-nova-900 text-[15px]">
                NOVA <span className="text-nova-blue">ERP</span>
              </p>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-nova-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 text-sm mt-1.5">
                Sign in to your account to continue
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="bg-red-50 text-red-700 text-sm font-medium rounded-2xl px-4 py-3 mb-5 border border-red-100"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* Business Code */}
              <div>
                <label
                  htmlFor="businessCode"
                  className="text-sm font-medium text-slate-700"
                >
                  Business Code
                </label>
                <div className="relative mt-1.5">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    id="businessCode"
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. MBS4821"
                    className={`w-full pl-11 pr-4 py-3 border rounded-2xl uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-nova-blue/30 focus:border-nova-blue ${inputErrorClass(
                      fieldErrors.businessCode
                    )}`}
                    value={businessCode}
                    onChange={(e) => {
                      setBusinessCode(e.target.value);
                      clearError("businessCode");
                    }}
                  />
                </div>
                <FieldError message={fieldErrors.businessCode} />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className={`w-full pl-11 pr-4 py-3 border rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-nova-blue/30 focus:border-nova-blue ${inputErrorClass(
                      fieldErrors.email
                    )}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                  />
                </div>
                <FieldError message={fieldErrors.email} />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full pl-11 pr-12 py-3 border rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-nova-blue/30 focus:border-nova-blue ${inputErrorClass(
                      fieldErrors.password
                    )}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-nova-gradient text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-blue/40 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} strokeWidth={2.25} />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-8 pt-5 flex items-start gap-2.5">
              <ShieldCheck
                size={15}
                className="text-nova-blue flex-shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Secure and trusted. By signing in you agree to our{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-slate-500 hover:text-slate-700 transition"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-slate-500 hover:text-slate-700 transition"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-slate-500 text-xs tracking-wide">
            NOVA ERP<span className="align-super text-[8px]">™</span>
            &nbsp;·&nbsp;v1.0
          </p>
          <p className="text-slate-600/80 text-[11px]">
            Inventory · Sales · Purchases · Payroll · Reports · More
          </p>
        </div>
      </div>
    </div>
  );
}