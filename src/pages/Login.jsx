import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState("");

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { companyId, email, password });

      const { token, user } = res.data;

      setAuth(user, token);

      toast.success("Login successful!");

      // Role-based redirect
      if (user.role === "OWNER" || user.role === "MANAGER") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Nova ERP</h1>
        <p className="text-center text-slate-500 mb-8">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="text"
            placeholder="Company ID"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}