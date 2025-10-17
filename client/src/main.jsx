import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { validateAccess } from "../src/utils/validate.js";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { LoadingProvider } from "./context/LoadingProvider.jsx";
import "./index.css";

validateAccess();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </AuthProvider>
  </StrictMode>
);
