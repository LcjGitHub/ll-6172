import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { fetchFavorites, addFavorite, removeFavorite } from './api';

export function useFavorites(numericId: number) {
  const queryClient = useQueryClient();

  const favoritesQuery = createQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  const addMutation = createMutation({
    mutationFn: () => addFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeMutation = createMutation({
    mutationFn: () => removeFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return {
    favoritesQuery,
    addMutation,
    removeMutation,
  };
}
