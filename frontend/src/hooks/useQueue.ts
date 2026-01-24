import useSWR from 'swr';
import { api } from '@/lib/api';
import type { ScheduledPin } from '@/lib/types';

export function useQueue() {
  const { data, error, mutate, isLoading } = useSWR('queue', () => api.getQueue());

  const addToQueue = async (photoId: string, boardId: string, linkUrl?: string) => {
    await api.addToQueue({ photo_id: photoId, board_id: boardId, link_url: linkUrl });
    mutate();
  };

  const reorder = async (pinId: string, newPosition: number) => {
    // Optimistic update
    if (data) {
      const pins = [...data.pins];
      const currentIndex = pins.findIndex((p) => p.id === pinId);
      if (currentIndex !== -1) {
        const [pin] = pins.splice(currentIndex, 1);
        pins.splice(newPosition, 0, pin);
        mutate({ ...data, pins }, false);
      }
    }

    await api.reorderPin(pinId, newPosition);
    mutate();
  };

  const remove = async (pinId: string) => {
    await api.removeFromQueue(pinId);
    mutate();
  };

  const pause = async () => {
    await api.pauseQueue();
    mutate();
  };

  const resume = async () => {
    await api.resumeQueue();
    mutate();
  };

  return {
    pins: data?.pins as ScheduledPin[] | undefined,
    total: data?.total || 0,
    nextPost: data?.next_post,
    isPaused: data?.is_paused || false,
    isLoading,
    isError: error,
    mutate,
    addToQueue,
    reorder,
    remove,
    pause,
    resume,
  };
}
