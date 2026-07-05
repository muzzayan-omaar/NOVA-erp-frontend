import { useEffect, useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function StoreSwitcher() {
  const { setAuth, user } = useAuthStore();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Load stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores");
        setStores(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStores();
  }, []);

  // 2. Switch store (IMPORTANT PART)
  const handleSwitch = async (e) => {
    const storeId = e.target.value;
    if (!storeId) return;

    setLoading(true);

    try {
      const res = await api.post("/stores/switch", {
        storeId,
      });

      const { user: updatedUser, message } = res.data;

      // 🔥 update global auth state (NO reload, NO localStorage)
      setAuth(updatedUser);

      toast.success(message || "Store switched");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to switch store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-3">
      <select
        onChange={handleSwitch}
        value={user?.activeStoreId || user?.storeId || ""}
        className="w-full p-2 rounded bg-slate-800 text-white"
        disabled={loading}
      >
        <option value="">Select Store</option>

        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}