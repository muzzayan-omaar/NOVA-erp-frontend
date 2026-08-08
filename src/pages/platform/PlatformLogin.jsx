import { useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import usePlatformAuthStore from "../../store/usePlatformAuthStore";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function PlatformLogin() {
  const navigate = useNavigate();
  const setAuth = usePlatformAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    console.log("SUBMIT FIRED");
    e.preventDefault();
    setLoading(true);

    try {
      const res = await platformApi.post("/platform/auth/login", { email, password });
      setAuth(res.data.admin, res.data.token);
      navigate("/platform/payments");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <ShieldCheck className="mx-auto text-blue-600 mb-3" size={44} />
          <h1 className="text-xl font-bold">Nova Platform Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Not a shop login — platform owner access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-2xl mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 border rounded-2xl mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}