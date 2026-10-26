import { createBrowserRouter } from "react-router";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Home from "../features/static/Home.jsx";
import StyleGuide from "../features/static/StyleGuide.jsx";
import NotFound from "../features/static/NotFound.jsx";
import ComingSoon from "../features/static/ComingSoon.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "../features/auth/VerifyEmailPage.jsx";
import { GuestOnly, RequireAuth } from "./guards.jsx";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <ComingSoon title="Products" /> },
      { path: "about", element: <ComingSoon title="About" /> },
      { path: "quality", element: <ComingSoon title="Quality" /> },
      { path: "contact", element: <ComingSoon title="Contact" /> },
      { path: "styleguide", element: <StyleGuide /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      // Open to everyone (a logged-in user may click these email links)
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      // Guests only
      {
        element: <GuestOnly />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth role="ADMIN" />,
    children: [
      {
        path: "admin",
        element: <AdminLayout />,
        children: [{ index: true, element: <ComingSoon title="Dashboard" /> }],
      },
    ],
  },
]);
