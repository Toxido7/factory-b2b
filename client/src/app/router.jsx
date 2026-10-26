import { createBrowserRouter } from "react-router";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Home from "../features/static/Home.jsx";
import StyleGuide from "../features/static/StyleGuide.jsx";
import NotFound from "../features/static/NotFound.jsx";
import ComingSoon from "../features/static/ComingSoon.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
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
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <ComingSoon title="Register" /> },
          {
            path: "forgot-password",
            element: <ComingSoon title="Forgot password" />,
          },
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
