import useSWR from 'swr';
import { api } from '@/lib/api';
import type { Photo, PhotoStats } from '@/lib/types';

export function usePhotos(status?: string) {
  const { data, error, mutate, isLoading } = useSWR(
    ['photos', status],
    () => api.getPhotos(status)
  );

  return {
    photos: data?.photos as Photo[] | undefined,
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePhotoStats() {
  const { data, error, mutate, isLoading } = useSWR(
    'photo-stats',
    () => api.getPhotoStats()
  );

  return {
    stats: data as PhotoStats | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSyncPhotos() {
  const sync = async () => {
    return api.syncPhotos();
  };

  return { sync };
}
