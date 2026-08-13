import { create } from "zustand";

const usePlatformAuthStore = create((set) => ({
  admin: null,
  token: null,

  setAuth: (admin, token) => {
    sessionStorage.setItem("platform_admin", JSON.stringify(admin));
    sessionStorage.setItem("platform_token", token);
    set({ admin, token });
  },

  logout: () => {
    sessionStorage.removeItem("platform_admin");
    sessionStorage.removeItem("platform_token");
    set({ admin: null, token: null });
  },

  hydrate: () => {
    const admin = JSON.parse(sessionStorage.getItem("platform_admin") || "null");
    const token = sessionStorage.getItem("platform_token");

    if (admin && token) {
      set({ admin, token });
    }
  },
}));

export default usePlatformAuthStore;