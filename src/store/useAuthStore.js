import { create } from "zustand";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", token);
    set({ user, token });
  },

  // Called after a silent refresh — updates just the access token (and the
  // user object, in case something changed server-side) without re-running
  // any full-login side effects.
  setAccessToken: (token, user) => {
    sessionStorage.setItem("token", token);
    if (user) sessionStorage.setItem("user", JSON.stringify(user));
    set((state) => ({ token, user: user || state.user }));
  },

  logout: () => {
    // Local state clears synchronously first — the redirect that usually
    // follows logout() shouldn't wait on a network call.
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    set({ user: null, token: null });

    // Best-effort: revoke the real server-side session too. Clearing
    // sessionStorage alone was never a genuine logout — the refresh token
    // stayed valid server-side until this call exists.
    axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
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