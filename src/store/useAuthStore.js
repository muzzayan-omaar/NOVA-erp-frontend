import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    set({ user: null, token: null });
  },

  hydrate: () => {
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    const token = sessionStorage.getItem("token");

    if (user && token) {
      set({ user, token });
    }
  },
}));

export default useAuthStore;