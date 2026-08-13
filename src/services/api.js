import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user?.activeStoreId || user?.storeId) {
    config.headers["x-store-id"] = user.activeStoreId || user.storeId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Existing 401 handling
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = "/login";
    }

    // Universal 402 (subscription expired / no active subscription)
    if (error.response?.status === 402) {
      toast.error(error.response.data?.message || "Subscription expired");

      const role = JSON.parse(sessionStorage.getItem("user") || "null")?.role;

      if (
        role === "GENERAL_MANAGER" &&
        !window.location.pathname.includes("/admin/billing")
      ) {
        window.location.href = "/admin/billing";
      }
    }

    return Promise.reject(error);
  }
);

export default api;