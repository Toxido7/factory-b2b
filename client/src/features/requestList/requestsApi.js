import { api } from "../../api/client.js";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
// Send the request list to the server. Returns the created request.
export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, notes }) => {
      const body = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };
      if (notes.trim()) body.notes = notes.trim();
      const res = await api.post("/requests", body);
      return res.data.data.request;
    },
    onSuccess: () => {
      // the "my requests" lists (F4.4) must reload next time
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
// One page of the logged-in user's requests (optional status filter).
export function useMyRequests({ page, status }) {
  return useQuery({
    queryKey: ["requests", "mine", { page, status }],
    queryFn: async () => {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const res = await api.get("/requests/mine", { params });
      return res.data.data; // { requests, pagination }
    },
    placeholderData: keepPreviousData, // old page stays visible while the next one loads
  });
}
// One request of the logged-in user, with its items.
export function useMyRequest(id) {
  return useQuery({
    queryKey: ["requests", "detail", id],
    queryFn: async () => {
      const res = await api.get(`/requests/mine/${id}`);
      return res.data.data.request;
    },
    retry: false, // a 404 will not fix itself
  });
}
