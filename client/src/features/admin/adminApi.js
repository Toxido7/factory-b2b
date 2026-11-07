import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../../api/client"; // same import as requestsApi.js

// All categories (no pagination on the server).
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () =>
      (await api.get("/admin/categories")).data.data.categories,
  });
}

// POST: empty optional fields are left out (the server refuses null on create).
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values) => {
      const body = { name: values.name.trim() };
      if (values.description?.trim())
        body.description = values.description.trim();
      if (values.parentId) body.parentId = values.parentId;
      return (await api.post("/admin/categories", body)).data.data.category;
    },
    // The public shop shows categories too, so everything becomes stale.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

// PATCH: null clears a field. Used for the edit form AND for hide/show ({ isActive }).
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) =>
      (await api.patch(`/admin/categories/${id}`, body)).data.data.category,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
// All products, active and hidden (no pagination on the server).
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => (await api.get("/admin/products")).data.data.products,
  });
}

// PATCH one product. Used for hide/show ({ isActive }) now and for the edit form in F6.4.
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) =>
      (await api.patch(`/admin/products/${id}`, body)).data.data.product,
    // The public shop shows products too, so everything becomes stale.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
// One product (admin view, hidden ones included).
export function useAdminProduct(id) {
  return useQuery({
    queryKey: ["admin", "products", "detail", id],
    queryFn: async () =>
      (await api.get(`/admin/products/${id}`)).data.data.product,
    retry: false, // a 404 will not fix itself
  });
}

// POST: optional fields are left out when empty (the server refuses null on create).
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values) => {
      const body = {
        sku: values.sku,
        name: values.name,
        price: values.price,
        categoryId: values.categoryId,
      };
      if (values.description) body.description = values.description;
      if (values.minQuantity) body.minQuantity = values.minQuantity;
      if (values.discountPercent) body.discountPercent = values.discountPercent;
      return (await api.post("/admin/products", body)).data.data.product;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

// Upload one photo (multipart, field name "image").
export function useUploadProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }) => {
      const form = new FormData();
      form.append("image", file);
      return (await api.post(`/admin/products/${id}/images`, form)).data.data
        .product;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

// Delete one photo by its file name (the last part of its URL).
export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filename }) =>
      (await api.delete(`/admin/products/${id}/images/${filename}`)).data.data
        .product,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
// One page of ALL customers' requests. Filtering and paging are done by the server.
export function useAdminRequests({ page, status, q }) {
  return useQuery({
    queryKey: ["admin", "requests", "list", { page, status, q }],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (q) params.q = q;
      const res = await api.get("/admin/requests", { params });
      return res.data.data; // { requests, pagination }
    },
    placeholderData: keepPreviousData,
  });
}

// One request with items, customer details and handledBy (used in F7.2).
export function useAdminRequest(id) {
  return useQuery({
    queryKey: ["admin", "requests", "detail", id],
    queryFn: async () =>
      (await api.get(`/admin/requests/${id}`)).data.data.request,
    retry: false, // a 404 will not fix itself
  });
}

// Change the status of a request (used in F7.2). The server checks the allowed transitions.
export function useChangeRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.patch(`/admin/requests/${id}/status`, { status })).data.data
        .request,
    // refreshes the list AND the detail, both start with these two key parts
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] }),
  });
}
// One page of customers. Search, filters and paging are done by the server.
export function useAdminUsers({ page, q, isActive, role }) {
  return useQuery({
    queryKey: ["admin", "users", "list", { page, q, isActive, role }],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (q) params.q = q;
      if (isActive) params.isActive = isActive; // 'true' or 'false'
      if (role) params.role = role; // 'USER' or 'ADMIN'
      const res = await api.get("/admin/users", { params });
      return res.data.data; // { users, pagination }
    },
    placeholderData: keepPreviousData,
  });
}

// Disable or enable an account. Disabling also logs the user out everywhere (server).
export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }) =>
      (await api.patch(`/admin/users/${id}/status`, { isActive })).data.data
        .user,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// Promote to ADMIN or demote to USER. The server also logs that user out everywhere.
export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }) =>
      (await api.patch(`/admin/users/${id}/role`, { role })).data.data.user,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
// Numbers for the 4 KPI cards and the status split.
export function useAdminOverview({ from, to }) {
  return useQuery({
    queryKey: ["admin", "stats", "overview", { from, to }],
    queryFn: async () =>
      (await api.get("/admin/stats/overview", { params: { from, to } })).data
        .data,
    placeholderData: keepPreviousData,
  });
}

// One point per day (empty days come back with count 0).
export function useAdminRequestsOverTime({ from, to }) {
  return useQuery({
    queryKey: ["admin", "stats", "over-time", { from, to }],
    queryFn: async () =>
      (
        await api.get("/admin/stats/requests-over-time", {
          params: { from, to, interval: "day" },
        })
      ).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useAdminTopProducts({ from, to }) {
  return useQuery({
    queryKey: ["admin", "stats", "top-products", { from, to }],
    queryFn: async () =>
      (
        await api.get("/admin/stats/top-products", {
          params: { from, to, limit: 5 },
        })
      ).data.data,
    placeholderData: keepPreviousData,
  });
}

export function useAdminTopCustomers({ from, to }) {
  return useQuery({
    queryKey: ["admin", "stats", "top-customers", { from, to }],
    queryFn: async () =>
      (
        await api.get("/admin/stats/top-customers", {
          params: { from, to, limit: 5 },
        })
      ).data.data,
    placeholderData: keepPreviousData,
  });
}
