import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  
    <BrowserRouter>
     <Toaster
  position="top-right"
  toastOptions={{
    duration: 3200,
    style: {
      background: "#0B1426",          // slightly deeper than nova-950
      color: "#F1F5F9",
      borderRadius: "14px",
      padding: "13px 16px",
      fontSize: "13.5px",
      fontWeight: 500,
      letterSpacing: "0.01em",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow:
        "0 12px 40px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
    },
    success: {
      iconTheme: {
        primary: "#22D3EE",           // nova-cyan — kept, but softer context
        secondary: "#0B1426",
      },
      style: {
        border: "1px solid rgba(34, 211, 238, 0.18)",
      },
    },
    error: {
      iconTheme: {
        primary: "#F87171",           // soft red, not pure white
        secondary: "#1C0A0A",
      },
      style: {
        background: "#1C0A0A",
        border: "1px solid rgba(248, 113, 113, 0.22)",
        color: "#FECACA",
      },
    },
    // optional: loading / blank states stay neutral
  }}
/>
      <App />
    </BrowserRouter>
);