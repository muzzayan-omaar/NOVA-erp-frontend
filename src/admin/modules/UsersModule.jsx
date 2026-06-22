import { useEffect, useState } from "react";
import api from "../../services/api";
import { UserPlus, Trash2, Edit2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function UsersModule() {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("list"); // list, create, edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER"
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async () => {
    try {
      await api.post("/users", form);
      toast.success("User created successfully");
      setForm({ name: "", email: "", password: "", role: "CASHIER" });
      setMode("list");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const updateUser = async () => {
    try {
      await api.patch(`/users/${selectedUser.id}`, {
        name: form.name,
        email: form.email,
        role: form.role
      });
      toast.success("User updated");
      setMode("list");
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User /> Staff Management
        </h1>
        <button
          onClick={() => { setMode("create"); setSelectedUser(null); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus size={20} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Users List */}
        <div className="col-span-5 bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-lg mb-4">Team Members</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setForm({
                    name: u.name,
                    email: u.email,
                    password: "",
                    role: u.role
                  });
                  setMode("edit");
                }}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-medium ${
                  u.role === "OWNER" ? "bg-purple-100 text-purple-700" :
                  u.role === "MANAGER" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {u.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Form */}
        <div className="col-span-7 bg-white rounded-3xl shadow p-8">
          {mode === "list" && (
            <div className="h-full flex items-center justify-center text-slate-400 text-lg">
              Select a user or click "Add Staff"
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">
                {mode === "create" ? "Add New Staff" : "Edit Staff"}
              </h2>

              <input
                placeholder="Full Name"
                className="w-full p-4 border rounded-2xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Email Address"
                type="email"
                className="w-full p-4 border rounded-2xl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              {mode === "create" && (
                <input
                  placeholder="Password"
                  type="password"
                  className="w-full p-4 border rounded-2xl"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              )}

              <select
                className="w-full p-4 border rounded-2xl"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="CASHIER">Cashier</option>
                <option value="MANAGER">Manager</option>
                <option value="OWNER">Owner</option>
              </select>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={mode === "create" ? createUser : updateUser}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold"
                >
                  {mode === "create" ? "Create User" : "Save Changes"}
                </button>

                {mode === "edit" && (
                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}