import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { fetchVisitRecords, createVisitRecord } from './api';

export function useVisitRecords(id: string, numericId: number, isValidId: boolean) {
  const queryClient = useQueryClient();

  const visitRecordsQuery = createQuery({
    queryKey: ['visit-records', id],
    queryFn: () => fetchVisitRecords(numericId),
    enabled: isValidId,
  });

  const formState = $state({
    newVisitDate: '',
    newLocationNotes: '',
    newPlateVisible: false,
    formError: '',
  });

  function resetForm() {
    formState.newVisitDate = '';
    formState.newLocationNotes = '';
    formState.newPlateVisible = false;
    formState.formError = '';
  }

  const addVisitMutation = createMutation({
    mutationFn: () =>
      createVisitRecord({
        styleId: numericId,
        visitDate: formState.newVisitDate,
        locationNotes: formState.newLocationNotes,
        plateVisible: formState.newPlateVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-records', id] });
      resetForm();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-records', id] });
    },
  });

  return {
    visitRecordsQuery,
    formState,
    addVisitMutation,
  };
}
