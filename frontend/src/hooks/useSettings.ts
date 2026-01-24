import useSWR from 'swr';
import { api } from '@/lib/api';
import type { Settings, BoardMapping } from '@/lib/types';

export function useSettings() {
  const { data, error, mutate, isLoading } = useSWR('settings', () => api.getSettings());

  const update = async (updates: Partial<Settings>) => {
    await api.updateSettings(updates);
    mutate();
  };

  return {
    settings: data as Settings | undefined,
    isLoading,
    isError: error,
    mutate,
    update,
  };
}

export function useBoardMappings() {
  const { data, error, mutate, isLoading } = useSWR('board-mappings', () =>
    api.getBoardMappings()
  );

  const updateMapping = async (
    category: string,
    updates: { board_id?: string; board_name?: string; link_url?: string }
  ) => {
    await api.updateBoardMapping(category, updates);
    mutate();
  };

  return {
    mappings: data?.mappings as BoardMapping[] | undefined,
    isLoading,
    isError: error,
    mutate,
    updateMapping,
  };
}
