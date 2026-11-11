import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";

export function useSiteContent() {
  const query = useQuery({
    queryKey: ["content"],
    queryFn: async () => {
      const res = await api.get("/content");
      return res.data.data.content;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const content = query.data ?? {};

  // her text if she wrote one, otherwise our default
  const text = (key, fallback) => content[key] || fallback;

  return { text, isLoading: query.isLoading };
}
