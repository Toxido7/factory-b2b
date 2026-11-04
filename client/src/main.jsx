import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import { router } from "./app/router.jsx";
import { AuthProvider } from "./features/auth/AuthContext.jsx";
import { RequestListProvider } from "./features/requestList/RequestListContext.jsx";
import { queryClient } from "./lib/queryClient.js";
import "./i18n/index.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RequestListProvider>
          <RouterProvider router={router} />
        </RequestListProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
