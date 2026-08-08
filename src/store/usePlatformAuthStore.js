import { create } from "zustand";

// Deliberately separate localStorage keys from the tenant auth store —
// this identity has nothing to do with any company, and must never
// collide with or be cleared by tenant-side logic.
const usePlatformAuthStore = create((set) => ({
  admin: null,
  token: null,

  setAuth: (admin, token) => {
    localStorage.setItem("platform_admin", JSON.stringify(admin));
    localStorage.setItem("platform_token", token);
    set({ admin, token });
  },

  logout: () => {
    localStorage.removeItem("platform_admin");
    localStorage.removeItem("platform_token");
    set({ admin: null, token: null });
  },

  hydrate: () => {
    const admin = JSON.parse(localStorage.getItem("platform_admin") || "null");
    const token = localStorage.getItem("platform_token");

    if (admin && token) {
      set({ admin, token });
    }
  },
}));

export default usePlatformAuthStore;