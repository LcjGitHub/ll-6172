import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { fetchTags, fetchStyleTags, bindStyleTag, unbindStyleTag } from './api';

export function useStyleTags(id: string, numericId: number, isValidId: boolean) {
  const queryClient = useQueryClient();

  const allTagsQuery = createQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const styleTagsQuery = createQuery({
    queryKey: ['style-tags', id],
    queryFn: () => fetchStyleTags(numericId),
    enabled: isValidId,
  });

  let selectedTagId = $state<number | ''>('');

  function handleTagSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    selectedTagId = value === '' ? '' : parseInt(value, 10);
  }

  const bindTagMutation = createMutation({
    mutationFn: (tagId: number) => bindStyleTag(numericId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
      selectedTagId = '';
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  const unbindTagMutation = createMutation({
    mutationFn: (tagId: number) => unbindStyleTag(numericId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  function getBadgeColor(color: string): 'amber' | 'blue' | 'red' | 'purple' | 'green' | 'pink' | 'indigo' | 'yellow' | 'teal' | 'cyan' | 'dark' {
    const validColors = ['amber', 'blue', 'red', 'purple', 'green', 'pink', 'indigo', 'yellow', 'teal', 'cyan', 'dark'] as const;
    return (validColors.includes(color as typeof validColors[number]) ? color : 'amber') as typeof validColors[number];
  }

  const tagState = $state({
    get selectedTagId() { return selectedTagId; },
    set selectedTagId(v: number | '') { selectedTagId = v; },
  });

  return {
    allTagsQuery,
    styleTagsQuery,
    tagState,
    handleTagSelect,
    bindTagMutation,
    unbindTagMutation,
    getBadgeColor,
  };
}
