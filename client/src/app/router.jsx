import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
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
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "../features/auth/VerifyEmailPage.jsx";
import PageFallback from "../components/PageFallback.jsx";
import { GuestOnly, RequireAuth } from "./guards.jsx";

const AdminLayout = lazy(() => import("../layouts/AdminLayout.jsx"));
const AccountPage = lazy(() => import("../features/auth/AccountPage.jsx"));
const RequestListPage = lazy(() => import("../features/requestList/RequestListPage.jsx"));
const RequestSentPage = lazy(() => import("../features/requestList/RequestSentPage.jsx"));
const MyRequestsPage = lazy(() => import("../features/requestList/MyRequestsPage.jsx"));
const MyRequestDetailPage = lazy(() => import("../features/requestList/MyRequestDetailPage.jsx"));
const AdminCategoriesPage = lazy(() => import("../features/admin/AdminCategoriesPage.jsx"));
const AdminProductsPage = lazy(() => import("../features/admin/AdminProductsPage.jsx"));
const AdminProductFormPage = lazy(() => import("../features/admin/AdminProductFormPage.jsx"));
const AdminRequestsPage = lazy(() => import("../features/admin/AdminRequestsPage.jsx"));
const AdminRequestDetailPage = lazy(() => import("../features/admin/AdminRequestDetailPage.jsx"));
const AdminUsersPage = lazy(() => import("../features/admin/AdminUsersPage.jsx"));
const AdminDashboardPage = lazy(() => import("../features/admin/AdminDashboardPage.jsx"));

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
      { path: "styleguide", element: <StyleGuide /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <RequireAuth role="ADMIN" />,
    children: [
      {
        path: "admin",
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "categories", element: <AdminCategoriesPage /> },
          {
            path: "products",
            children: [
              { index: true, element: <AdminProductsPage /> },
              { path: "new", element: <AdminProductFormPage /> },
              { path: ":id", element: <AdminProductFormPage /> },
            ],
          },
          {
            path: "requests",
            children: [
              { index: true, element: <AdminRequestsPage /> },
              { path: ":id", element: <AdminRequestDetailPage /> },
            ],
          },
          { path: "users", element: <AdminUsersPage /> },
        ],
      },
    ],
  },
]);
