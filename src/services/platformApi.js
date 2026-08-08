import axios from "axios";
import toast from "react-hot-toast";
import usePlatformAuthStore from "../store/usePlatformAuthStore";

const platformApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

platformApi.interceptors.request.use((config) => {
  const { token } = usePlatformAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      usePlatformAuthStore.getState().logout();
      window.location.href = "/platform/login";
    } else if (error.response) {
      toast.error(error.response.data?.message || "Something went wrong");
    }
    return Promise.reject(error);
  }
);

export default platformApi;