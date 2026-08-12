import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/change-password", { currentPassword, newPassword });

      setAuth(res.data.user, token);
      toast.success("Password updated");

      if (res.data.user.role === "GENERAL_MANAGER" || res.data.user.role === "BRANCH_MANAGER") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to change password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="mx-auto text-blue-600 mb-3" size={44} />
          <h1 className="text-2xl font-bold">Set a New Password</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Welcome, {user?.name}. For security, please set your own password before continuing.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Current (temporary) password"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
            required
          />

          <input
            type="password"
            placeholder="New password"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition disabled:opacity-70"
          >
            {loading ? "Updating..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}