import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    },
    select: (categories) => categories ?? [],
  });
}

export function useNewProducts() {
  return useQuery({
    queryKey: ['products', 'new'],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { limit: 4, sort: 'newest' },
      });
      return data.data.products;
    },
    select: (products) => products ?? [],
  });
}

export function useProducts(filters) {
  return useQuery({
    queryKey: ['products', 'list', filters],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: Object.fromEntries(
          Object.entries({ page: filters.page ?? 1, limit: filters.limit ?? 12, q: filters.q ?? '', category: filters.category ?? '', minPrice: filters.minPrice ?? '', maxPrice: filters.maxPrice ?? '', sort: filters.sort ?? 'newest' })
            .filter(([, value]) => value !== ''),
        ),
      });
      return data.data;
    },
    placeholderData: keepPreviousData,
    enabled: filters.enabled ?? true,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['products', 'detail', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return data.data.product;
    },
    retry: (failureCount, error) => {
      if (error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}
