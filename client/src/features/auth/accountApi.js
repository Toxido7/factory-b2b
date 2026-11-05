import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client.js"; // same import as requestsApi.js

// PATCH /auth/me -> returns the updated user
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (body) =>
      (await api.patch("/auth/me", body)).data.data.user,
  });
}

// POST /auth/change-password -> the server revokes ALL sessions
export function useChangePassword() {
  return useMutation({
    mutationFn: async (body) =>
      (await api.post("/auth/change-password", body)).data.data,
  });
}

// POST /auth/logout-all -> the server revokes ALL sessions
export function useLogoutAll() {
  return useMutation({
    mutationFn: async () => (await api.post("/auth/logout-all")).data.data,
  });
}
