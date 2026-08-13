import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessCode, setBusinessCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { businessCode, email, password });

      const { token, user } = res.data;

      setAuth(user, token);

      toast.success("Login successful!");

      if (
        user.role === "GENERAL_MANAGER" ||
        user.role === "BRANCH_MANAGER"
      ) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Invalid credentials";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Nova ERP</h1>
        <p className="text-center text-slate-500 mb-8">Sign in to your account</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="text"
            placeholder="Business Code (e.g. MBS4821)"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 uppercase"
            value={businessCode}
            onChange={(e) => { setBusinessCode(e.target.value); setError(""); }}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">
          By signing in you agree to our{" "}
          <a href="/terms" target="_blank" className="underline">Terms</a> and{" "}
          <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}