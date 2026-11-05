import { createBrowserRouter } from "react-router";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Home from "../features/static/Home.jsx";
import StyleGuide from "../features/static/StyleGuide.jsx";
import NotFound from "../features/static/NotFound.jsx";
import ComingSoon from "../features/static/ComingSoon.jsx";
import AboutPage from "../features/static/AboutPage.jsx";
import CategoriesPage from "../features/catalog/CategoriesPage.jsx";
import ProductsPage from "../features/catalog/ProductsPage.jsx";
import ProductPage from "../features/catalog/ProductPage.jsx";
import QualityPage from "../features/static/QualityPage.jsx";
import ContactPage from "../features/static/ContactPage.jsx";
import PrivacyPage from "../features/static/PrivacyPage.jsx";
import TermsPage from "../features/static/TermsPage.jsx";
import RequestListPage from "../features/requestList/RequestListPage.jsx";
import RequestSentPage from "../features/requestList/RequestSentPage.jsx";
import MyRequestsPage from "../features/requestList/MyRequestsPage.jsx";
import MyRequestDetailPage from "../features/requestList/MyRequestDetailPage.jsx";
import AccountPage from "../features/auth/AccountPage.jsx";
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
      { path: "products", element: <ProductsPage /> },
      { path: "products/:slug", element: <ProductPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "quality", element: <QualityPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "request-list", element: <RequestListPage /> },
      {
        element: <RequireAuth role="USER" />,
        children: [{ path: "request-list/sent", element: <RequestSentPage /> }],
      },
      {
        element: <RequireAuth role="USER" />,
        children: [
          { path: "account/requests", element: <MyRequestsPage /> },
          { path: "account/requests/:id", element: <MyRequestDetailPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: "account", element: <AccountPage /> }],
      },
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
