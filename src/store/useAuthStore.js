import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    set({ user: null, token: null });
  },

  hydrate: () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (user && token) {
      set({ user, token });
    }
  },
}));

export default useAuthStore;