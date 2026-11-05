import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
