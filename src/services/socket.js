import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

// Doesn't connect on its own: it connects once someone is logged in.
// `auth` runs on every (re)connect, so a refreshed token is picked up.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: sessionStorage.getItem("token") }),
});

export default socket;