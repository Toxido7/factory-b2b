import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";

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
