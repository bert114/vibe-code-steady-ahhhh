import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../public/token.css";
import "./styles/globals.css";

import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
