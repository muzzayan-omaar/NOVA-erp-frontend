import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

import { CompanyProvider } from "./context/CompanyContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <CompanyProvider>
    <BrowserRouter>
      <Toaster position="top-right" />
      <App />
    </BrowserRouter>
  </CompanyProvider>
);