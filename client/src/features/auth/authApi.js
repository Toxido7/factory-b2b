import { api } from "../../api/client.js";

export const registerAccount = (body) => api.post("/auth/register", body);
export const verifyEmail = (token) => api.post("/auth/verify-email", { token });
export const resendVerification = () => api.post("/auth/resend-verification");
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) =>
  api.post("/auth/reset-password", { token, password });
