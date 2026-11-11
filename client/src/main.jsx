import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import { router } from "./app/router.jsx";
import { AuthProvider } from "./features/auth/AuthContext.jsx";
import { RequestListProvider } from "./features/requestList/RequestListContext.jsx";
import AppToaster from "./components/AppToaster.jsx";
import { queryClient } from "./lib/queryClient.js";
import "./i18n/index.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RequestListProvider>
            <RouterProvider router={router} />
          </RequestListProvider>
        </AuthProvider>
      </QueryClientProvider>
      <AppToaster />
    </MotionConfig>
  </StrictMode>,
);
