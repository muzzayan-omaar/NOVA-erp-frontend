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
    duration: 3500,
    style: {
      background: '#0F1B33',
      color: '#fff',
      borderRadius: '16px',
      padding: '14px 18px',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px -10px rgba(15, 27, 51, 0.35)',
    },
    success: {
      iconTheme: { primary: '#22D3EE', secondary: '#0F1B33' },
    },
    error: {
      style: { background: '#7F1D1D' },
      iconTheme: { primary: '#fff', secondary: '#7F1D1D' },
    },
  }}
/>
      <App />
    </BrowserRouter>
);