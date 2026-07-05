import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user?.activeStoreId || user?.storeId) {
    config.headers["x-store-id"] =
      user.activeStoreId || user.storeId;
  }

  return config;
});

export default api;