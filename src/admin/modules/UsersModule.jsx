import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { UserPlus, Users, Hash, Building2 } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_STYLES = {
  GENERAL_MANAGER: "bg-violet-100 text-violet-700",
  BRANCH_MANAGER: "bg-blue-100 text-nova-blue",
  CASHIER: "bg-slate-100 text-slate-600",
};

export default function UsersModule() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users /> Staff Directory
        </h1>
        <button
          onClick={() => navigate("/admin/users/new")}
          className="bg-nova-gradient text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          <UserPlus size={20} /> New Staff
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-slate-500 py-16">No staff members yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/admin/users/${u.id}`)}
              className="bg-white rounded-3xl shadow-sm hover:shadow-nova p-6 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.employeeProfile?.photoUrl ? (
                    <img src={u.employeeProfile.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">{u.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{u.name}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {u.employeeProfile?.position || u.role.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role]}`}>
                  {u.role.replace(/_/g, " ")}
                </span>
                {!u.isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                    Inactive
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} /> {u.store?.name}
                </div>
                {u.employeeProfile?.staffId && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Hash size={12} /> {u.employeeProfile.staffId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}