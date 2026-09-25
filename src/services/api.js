import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // required so the HttpOnly refresh cookie is sent
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

// Concurrent 401s (several requests failing at once when the access token
// expires) share a single refresh call instead of each firing their own.
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Universal 402 (subscription expired) — unchanged
    if (error.response?.status === 402) {
      toast.error(error.response.data?.message || "Subscription expired");
      const role = JSON.parse(sessionStorage.getItem("user") || "null")?.role;
      if (role === "GENERAL_MANAGER" && !window.location.pathname.includes("/admin/billing")) {
        window.location.href = "/admin/billing";
      }
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { token: newToken, user } = res.data;

        useAuthStore.getState().setAccessToken(newToken, user);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // A 401 on the refresh/login call itself, or a request already retried
    // once and still failing — genuinely done, no more silent recovery.
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;