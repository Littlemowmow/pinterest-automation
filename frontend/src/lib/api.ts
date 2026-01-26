const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'An error occurred' }));
    throw new ApiError(res.status, error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Photos
  getPhotos: (status?: string) =>
    request<{ photos: any[]; total: number }>(`/photos${status ? `?status=${status}` : ''}`),

  getPhotoStats: () =>
    request<Record<string, number>>('/photos/stats/summary'),

  syncPhotos: () =>
    request<{ synced_count: number; new_photos: any[] }>('/photos/sync', { method: 'POST' }),

  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new ApiError(res.status, error.detail || `HTTP ${res.status}`);
    }

    return res.json();
  },

  uploadPhotos: async (files: File[], onProgress?: (uploaded: number, total: number) => void) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const res = await fetch(`${API_URL}/photos/upload/batch`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new ApiError(res.status, error.detail || `HTTP ${res.status}`);
    }

    return res.json() as Promise<{
      uploaded: number;
      failed: number;
      photos: Array<{ id: string; file_name: string; url: string; status: string }>;
      errors: Array<{ file: string; error: string }>;
    }>;
  },

  updatePhotoStatus: (id: string, status: string) =>
    request<any>(`/photos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Tags
  getTags: (photoId: string) =>
    request<{ tags: string[] }>(`/photos/${photoId}/tags`),

  updateTags: (photoId: string, tags: string[]) =>
    request<{ tags: string[] }>(`/photos/${photoId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    }),

  generateTags: (photoId: string) =>
    request<{ tags: string[]; board_suggestion?: string }>(`/photos/${photoId}/generate-tags`, {
      method: 'POST',
    }),

  // Queue
  getQueue: () =>
    request<{ pins: any[]; total: number; next_post?: string; is_paused: boolean }>('/queue'),

  addToQueue: (data: { photo_id: string; board_id: string; link_url?: string; title?: string }) =>
    request<any>('/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reorderPin: (pinId: string, newPosition: number) =>
    request<any>(`/queue/${pinId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ new_position: newPosition }),
    }),

  removeFromQueue: (pinId: string) =>
    request<{ success: boolean }>(`/queue/${pinId}`, { method: 'DELETE' }),

  pauseQueue: () =>
    request<{ success: boolean; paused: boolean }>('/queue/pause', { method: 'POST' }),

  resumeQueue: () =>
    request<{ success: boolean; paused: boolean }>('/queue/resume', { method: 'POST' }),

  // Settings
  getSettings: () =>
    request<any>('/settings'),

  updateSettings: (data: { drive_folder_id?: string; posting_interval_hours?: number; default_post_time?: string }) =>
    request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getBoardMappings: () =>
    request<{ mappings: any[] }>('/settings/board-mappings'),

  updateBoardMapping: (category: string, data: { board_id?: string; board_name?: string; link_url?: string }) =>
    request<any>(`/settings/board-mappings/${category}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export { ApiError };
